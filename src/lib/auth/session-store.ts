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

  getSnapshot = () => this.state;

  setSession(user: AuthUser, accessToken: string) {
    this.state = { user, accessToken };
    this.notify();
  }

  setAccessToken(accessToken: string) {
    if (!this.state.user) {
      return;
    }

    this.state = { ...this.state, accessToken };
    this.notify();
  }

  clearSession() {
    this.state = emptySession;
    this.notify();
  }

  subscribe = (listener: SessionListener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  hasCapability(capability: Capability, sigId?: number) {
    return Boolean(
      this.state.user && matchesCapability(this.state.user.role_assignments, capability, sigId),
    );
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }
}

export const sessionStore = new SessionStore();
