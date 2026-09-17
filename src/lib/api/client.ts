import { ApiError } from "@/lib/api/errors";
import { authRefreshSchema, validateAuthResponse } from "@/lib/api/auth-schemas";
import { sessionStore } from "@/lib/auth/session-store";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  retryOn401?: boolean;
};

let refreshPromise: Promise<void> | null = null;

function isAuthPath(path: string) {
  const pathname = path.split("?", 1)[0].replace(/\/+$/, "") || "/";
  return ["/auth/login", "/auth/refresh", "/auth/logout"].includes(pathname);
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
  if (accessToken && !isAuthPath(path)) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  // Marks this as an API request for the same-origin proxy (see
  // vite.config.ts server.proxy); page navigations to identical paths stay as pages.
  headers.set("X-CMS-API", "1");

  init.credentials = "include";
  init.headers = headers;
  return fetch(resolveUrl(path), init);
}

async function performRefresh(generation: number) {
  const response = await send("/auth/refresh", { method: "POST", retryOn401: false });
  const payload = validateAuthResponse(authRefreshSchema, await parseResponse<unknown>(response));
  if (!sessionStore.isCurrentGeneration(generation)) {
    throw new ApiError(401, "SESSION_CHANGED", "The session changed during the request.");
  }
  sessionStore.setAccessToken(payload.access_token);
}

async function refreshOnce() {
  if (!refreshPromise) {
    const generation = sessionStore.getGeneration();
    const pending = performRefresh(generation).catch((error: unknown) => {
      if (sessionStore.isCurrentGeneration(generation)) sessionStore.clearSession();
      throw error;
    });
    refreshPromise = pending;
  }

  const pending = refreshPromise;
  try {
    await pending;
  } finally {
    if (refreshPromise === pending) {
      refreshPromise = null;
    }
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  options.signal?.throwIfAborted();
  const response = await send(path, options);
  options.signal?.throwIfAborted();
  const shouldRefresh =
    response.status === 401 &&
    options.retryOn401 !== false &&
    !isAuthPath(path) &&
    Boolean(sessionStore.getSnapshot().accessToken);

  if (!shouldRefresh) {
    return parseResponse<T>(response);
  }

  await refreshOnce();
  options.signal?.throwIfAborted();
  return parseResponse<T>(
    await send(path, { ...options, retryOn401: false }),
  );
}
