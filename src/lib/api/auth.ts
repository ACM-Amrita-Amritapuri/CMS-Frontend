import { apiRequest } from "@/lib/api/client";
import type {
  AuthLoginResponse,
  AuthRefreshResponse,
  AuthUser,
} from "@/lib/api/types";

export async function login(input: { login: string; password: string }) {
  return apiRequest<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: input,
    retryOn401: false,
  });
}

/** Full-gate route: 403 responses carry the PASSWORD_CHANGE_REQUIRED / PROFILE_INCOMPLETE codes. */
export async function getMe() {
  const { user } = await apiRequest<{ user: AuthUser }>("/auth/me");
  return user;
}

export async function changePassword(input: {
  current_password: string;
  new_password: string;
}) {
  return apiRequest<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: input,
  });
}

export async function refreshSession() {
  return apiRequest<AuthRefreshResponse>("/auth/refresh", {
    method: "POST",
    retryOn401: false,
  });
}

export async function logout() {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
    retryOn401: false,
  });
}

export async function logoutAll() {
  return apiRequest<{ message: string }>("/auth/logout-all", {
    method: "POST",
  });
}
