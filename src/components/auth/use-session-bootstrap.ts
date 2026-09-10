import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { getMe, refreshSession } from "@/lib/api/auth";
import { sessionStore } from "@/lib/auth/session-store";
import { useSession } from "@/app/providers";

export type SessionStatus =
  | "loading"
  | "ready"
  | "password-change-required"
  | "profile-incomplete"
  | "signed-out"
  | "error";

type BootstrapOutcome =
  | { kind: "ready" | "password-change-required" | "profile-incomplete" | "signed-out" }
  | { kind: "error"; error: unknown };

/**
 * One session bootstrap per page load: restore the access token from the
 * refresh cookie, then resolve the user (or which onboarding gate applies).
 * Single-flight so parallel mounts share one round trip.
 */
let bootstrapPromise: Promise<BootstrapOutcome> | null = null;

async function bootstrap(): Promise<BootstrapOutcome> {
  let token: string;
  try {
    const refreshed = await refreshSession();
    token = refreshed.access_token;
    sessionStore.setAccessToken(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { kind: "signed-out" };
    }
    return { kind: "error", error };
  }

  try {
    const user = await getMe();
    sessionStore.setSession(user, token);
    return { kind: "ready" };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      if (error.code === "PASSWORD_CHANGE_REQUIRED") {
        return { kind: "password-change-required" };
      }
      if (error.code === "PROFILE_INCOMPLETE") {
        return { kind: "profile-incomplete" };
      }
    }
    return { kind: "error", error };
  }
}

export function useSessionBootstrap() {
  const { user } = useSession();
  const [outcome, setOutcome] = useState<BootstrapOutcome | null>(null);

  useEffect(() => {
    if (user || outcome) return;
    bootstrapPromise ??= bootstrap();
    void bootstrapPromise.then(setOutcome);
  }, [user, outcome]);

  const status = useMemo<SessionStatus>(() => {
    if (user) return "ready";
    if (!outcome) return "loading";
    if (outcome.kind === "ready") return "signed-out";
    return outcome.kind === "error" ? "error" : outcome.kind;
  }, [user, outcome]);

  const retry = () => {
    bootstrapPromise = null;
    setOutcome(null);
  };

  return {
    status,
    error: outcome?.kind === "error" ? outcome.error : undefined,
    retry,
  };
}
