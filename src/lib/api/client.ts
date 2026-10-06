import { ApiError } from "@/lib/api/errors";
import { authRefreshSchema, validateAuthResponse } from "@/lib/api/auth-schemas";
import { sessionStore } from "@/lib/auth/session-store";
import type { AuthRefreshResponse } from "@/lib/api/types";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  retryOn401?: boolean;
};

let refreshPromise: Promise<AuthRefreshResponse> | null = null;

function waitForSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  signal.throwIfAborted();

  let onAbort = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason ?? new DOMException("The operation was aborted.", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });
  });
  return Promise.race([promise, aborted]).finally(() => signal.removeEventListener("abort", onAbort));
}

function isAuthPath(path: string) {
  const pathname = path.split("?", 1)[0].replace(/\/+$/, "") || "/";
  return ["/auth/login", "/auth/refresh", "/auth/logout", "/auth/logout-all"].includes(pathname);
}

function isPublicAuthPath(path: string) {
  const pathname = path.split("?", 1)[0].replace(/\/+$/, "") || "/";
  return ["/auth/login", "/auth/refresh"].includes(pathname);
}

function resolveUrl(path: string) {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";
  if (!baseUrl || baseUrl === "/") {
    return path;
  }
  if (baseUrl.startsWith("/")) {
    return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  }
  return new URL(path.replace(/^\/+/, ""), `${baseUrl.replace(/\/+$/, "")}/`).toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDetails(value: unknown) {
  return isRecord(value) ? value : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (response.ok) {
    if (!raw.trim()) {
      if (response.status !== 204) {
        throw new ApiError(response.status, "INTERNAL_ERROR", "The server returned an empty response.");
      }
      return undefined as T;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new ApiError(
        response.status,
        "INTERNAL_ERROR",
        "The server returned an invalid response.",
      );
    }
  }

  let payload: unknown;
  try {
    payload = raw ? JSON.parse(raw) : undefined;
  } catch {
    payload = undefined;
  }

  const error = isRecord(payload) && isRecord(payload.error) ? payload.error : {};
  const code = typeof error.code === "string" ? error.code : "INTERNAL_ERROR";
  const message = typeof error.message === "string" ? error.message : "The request failed.";
  throw new ApiError(response.status, code, message, toDetails(error.details));
}

async function send(path: string, options: ApiRequestOptions) {
  const { body, ...requestInit } = options;
  delete requestInit.retryOn401;
  const init: RequestInit = requestInit;
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined) {
    if (isFormData) {
      init.body = body;
    } else {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(body);
    }
  }

  const accessToken = sessionStore.getSnapshot().accessToken;
  if (accessToken && !isPublicAuthPath(path)) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  // Marks this as an API request for the same-origin proxy (see
  // vite.config.ts server.proxy); page navigations to identical paths stay as pages.
  headers.set("X-CMS-API", "1");

  init.credentials = "include";
  init.headers = headers;
  return fetch(resolveUrl(path), init);
}

async function performRefresh(generation: number): Promise<AuthRefreshResponse> {
  const response = await send("/auth/refresh", { method: "POST", retryOn401: false });
  const payload = validateAuthResponse(authRefreshSchema, await parseResponse<unknown>(response));
  if (!sessionStore.isCurrentGeneration(generation)) {
    throw new ApiError(401, "SESSION_CHANGED", "The session changed during the request.");
  }
  sessionStore.setAccessToken(payload.access_token);
  return payload;
}

export async function refreshSessionOnce(signal?: AbortSignal) {
  let pending = refreshPromise;
  if (!pending) {
    const generation = sessionStore.getGeneration();
    pending = performRefresh(generation).catch((error: unknown) => {
      if (sessionStore.isCurrentGeneration(generation)) sessionStore.clearSession("expired");
      throw error;
    });
    refreshPromise = pending;
    void pending.then(
      () => { if (refreshPromise === pending) refreshPromise = null; },
      () => { if (refreshPromise === pending) refreshPromise = null; },
    );
  }
  return waitForSignal(pending, signal);
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const method = options.method ?? "GET";
  const started = performance.now();
  try {
    options.signal?.throwIfAborted();
    let response = await send(path, options);
    options.signal?.throwIfAborted();
    const shouldRefresh =
      response.status === 401 &&
      options.retryOn401 !== false &&
      !isAuthPath(path) &&
      Boolean(sessionStore.getSnapshot().accessToken);

    if (shouldRefresh) {
      await refreshSessionOnce(options.signal ?? undefined);
      options.signal?.throwIfAborted();
      response = await send(path, { ...options, retryOn401: false });
    }

    const result = await parseResponse<T>(response);
    if (import.meta.env.DEV) {
      console.info(`[cms api] ${method} ${path} -> ${response.status} (${Math.round(performance.now() - started)}ms)`);
    }
    return result;
  } catch (error) {
    if (!(error instanceof Error && error.name === "AbortError")) {
      if (import.meta.env.DEV) {
        console.error(`[cms api] ${method} ${path} failed`, {
          status: error instanceof ApiError ? error.status : undefined,
          code: error instanceof ApiError ? error.code : error instanceof Error ? error.name : "UNKNOWN",
          duration_ms: Math.round(performance.now() - started),
        });
      }
    }
    throw error;
  }
}
