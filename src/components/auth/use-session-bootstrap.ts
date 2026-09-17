import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { getMe, refreshSession } from "@/lib/api/auth";
import { sessionStore } from "@/lib/auth/session-store";
import { useSession } from "@/app/providers";

type SessionStatus =
  | "loading"
  | "ready"
  | "password-change-required"
  | "profile-incomplete"
  | "signed-out"
  | "error";

type BootstrapOutcome = {
  generation: number;
  kind: Exclude<SessionStatus, "loading">;
  error?: unknown;
};

let bootstrapFlight: {
  generation: number;
  promise: Promise<BootstrapOutcome>;
} | null = null;

async function bootstrap(generation: number): Promise<BootstrapOutcome> {
  const current = () => sessionStore.isCurrentGeneration(generation);
  try {
    if (!sessionStore.getSnapshot().accessToken) {
      const refreshed = await refreshSession();
      if (!current()) return { generation, kind: "signed-out" };
      sessionStore.setAccessToken(refreshed.access_token);
    }
    const user = await getMe();
    if (!current()) return { generation, kind: "signed-out" };
    const token = sessionStore.getSnapshot().accessToken;
    if (!token) return { generation, kind: "signed-out" };
    sessionStore.setSession(user, token);
    return {
      generation: sessionStore.getGeneration(),
      kind: user.must_change_password ? "password-change-required" : "ready",
    };
  } catch (error) {
    if (!current()) return { generation, kind: "signed-out" };
    if (error instanceof ApiError) {
      if (error.status === 401) {
        sessionStore.clearSession();
        return { generation: sessionStore.getGeneration(), kind: "signed-out" };
      }
      if (error.status === 403) {
        if (error.code === "PASSWORD_CHANGE_REQUIRED") {
          return { generation, kind: "password-change-required" };
        }
        if (error.code === "PROFILE_INCOMPLETE") {
          return { generation, kind: "profile-incomplete" };
        }
      }
    }
    return { generation, kind: "error", error };
  }
}

export function useSessionBootstrap() {
  const { user, accessToken, generation } = useSession();
  const [outcome, setOutcome] = useState<BootstrapOutcome | null>(null);
  const [attempt, setAttempt] = useState(0);
  const canBootstrap = sessionStore.canBootstrap();

  useEffect(() => {
    if (user || !canBootstrap) return;
    if (!bootstrapFlight || bootstrapFlight.generation !== generation) {
      bootstrapFlight = { generation, promise: bootstrap(generation) };
    }
    let active = true;
    void bootstrapFlight.promise.then((result) => {
      if (active && sessionStore.isCurrentGeneration(result.generation)) setOutcome(result);
    });
    return () => {
      active = false;
    };
  }, [user, generation, canBootstrap, attempt]);

  const currentOutcome = outcome?.generation === generation ? outcome : null;
  const status: SessionStatus = user && accessToken
    ? user.must_change_password ? "password-change-required" : "ready"
    : !canBootstrap
      ? "signed-out"
      : currentOutcome?.kind === "ready"
        ? "signed-out"
        : currentOutcome?.kind ?? "loading";

  const retry = () => {
    if (!sessionStore.canBootstrap()) return;
    bootstrapFlight = null;
    setOutcome(null);
    setAttempt((value) => value + 1);
  };

  return {
    status,
    error: status === "error" ? currentOutcome?.error : undefined,
    retry,
  };
}
