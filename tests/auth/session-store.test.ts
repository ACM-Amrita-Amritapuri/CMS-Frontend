import { describe, expect, it, vi } from "vitest";

import { SessionStore } from "@/lib/auth/session-store";

describe("SessionStore", () => {
  it("publishes changes and removes the listener on unsubscribe", () => {
    const store = new SessionStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setAccessToken("access-token");
    unsubscribe();
    store.clearSession();

    expect(store.getSnapshot()).toEqual({ accessToken: null, user: null });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
