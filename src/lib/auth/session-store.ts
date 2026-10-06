import type { AuthUser } from "@/lib/api/types";
import { hasCapability as matchesCapability } from "@/lib/auth/permissions";

export type Capability =
  | "administer"
  | "manage_content"
  | "review_documentation"
  | "manage_operations";

export interface SessionState {
  accessToken: string | null;
  user: AuthUser | null;
}

type SessionListener = () => void;

const emptySession: SessionState = { accessToken: null, user: null };

export class SessionStore {
  private state: SessionState = emptySession;
  private readonly listeners = new Set<SessionListener>();
  private generation = 0;
  private clearReason: "expired" | "signout" | null = null;

  getSnapshot = () => this.state;

  getGeneration = () => this.generation;

  getClearReason = () => this.clearReason;

  isCurrentGeneration = (generation: number) => this.generation === generation;

  canBootstrap = () => this.generation === 0 || this.state.accessToken !== null;

  setSession(user: AuthUser, accessToken: string) {
    this.generation += 1;
    this.clearReason = null;
    this.state = { user, accessToken };
    this.notify();
  }

  /**
   * Store a token without a user yet (e.g. cookie refresh during onboarding,
   * where /auth/me is still gated by password/profile states).
   */
  setAccessToken(accessToken: string) {
    if (this.state.accessToken === accessToken) return;
    this.state = { ...this.state, accessToken };
  }

  clearSession(reason: "expired" | "signout" = "expired") {
    this.generation += 1;
    this.clearReason = reason;
    this.state = { ...emptySession };
    this.notify();
  }

  subscribe = (listener: SessionListener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  hasCapability = (capability: Capability, sigId?: number) =>
    Boolean(this.state.user && matchesCapability(this.state.user.role_assignments, capability, sigId));

  private notify() {
    this.listeners.forEach((listener) => listener());
  }
}

export const sessionStore = new SessionStore();
