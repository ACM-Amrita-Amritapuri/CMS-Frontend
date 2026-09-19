import { apiRequest } from "@/lib/api/client";
import { sessionStore } from "@/lib/auth/session-store";
import { authLoginSchema, authMeSchema, authRefreshSchema, validateAuthResponse } from "@/lib/api/auth-schemas";

export async function login(input: { login: string; password: string }) {
  return validateAuthResponse(authLoginSchema, await apiRequest<unknown>("/auth/login", {
    method: "POST",
    body: input,
    retryOn401: false,
  }));
}

/** Full-gate route: 403 responses carry the PASSWORD_CHANGE_REQUIRED / PROFILE_INCOMPLETE codes. */
export async function getMe(signal?: AbortSignal) {
  const { user } = validateAuthResponse(authMeSchema, await apiRequest<unknown>("/auth/me", { signal }));
  return user;
}

export async function changePassword(input: {
  current_password?: string;
  new_password: string;
}) {
  return validateAuthResponse(authLoginSchema, await apiRequest<unknown>("/auth/change-password", {
    method: "POST",
    body: input,
  }));
}

export async function refreshSession() {
  return validateAuthResponse(authRefreshSchema, await apiRequest<unknown>("/auth/refresh", {
    method: "POST",
    retryOn401: false,
  }));
}

async function signOut(path: string) {
  const generation = sessionStore.getGeneration();
  try {
    return await apiRequest<{ message: string }>(path, {
      method: "POST",
      retryOn401: false,
    });
  } finally {
    if (sessionStore.isCurrentGeneration(generation)) sessionStore.clearSession();
  }
}

export async function logout() {
  return signOut("/auth/logout");
}

export async function logoutAll() {
  return signOut("/auth/logout-all");
}
