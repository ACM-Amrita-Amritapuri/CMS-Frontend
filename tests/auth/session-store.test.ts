import { describe, expect, it, vi } from "vitest";
import { SessionStore } from "@/lib/auth/session-store";

const member = {
  id: 1,
  username: "member",
  roll_number: "A1",
  must_change_password: false,
  role_assignments: [
    { role_code: "SIG_CORE" as const, sig_id: 3 },
    { role_code: "MEMBER" as const, sig_id: null },
  ],
};

describe("SessionStore", () => {
  it("publishes session changes and clears all in-memory state", () => {
    const store = new SessionStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setSession(member, "access-token");
    expect(store.getSnapshot()).toEqual({ accessToken: "access-token", user: member });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.clearSession();
    expect(store.getSnapshot()).toEqual({ accessToken: null, user: null });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("matches SIG-scoped and global capabilities", () => {
    const store = new SessionStore();
    store.setSession(member, "access-token");

    expect(store.hasCapability("manage_content", 3)).toBe(true);
    expect(store.hasCapability("manage_content", 4)).toBe(false);
    expect(store.hasCapability("manage_content")).toBe(true);
    expect(store.hasCapability("administer")).toBe(false);

    store.setSession(
      { ...member, role_assignments: [{ role_code: "SIG_CORE", sig_id: null }] },
      "invalid-scoped-token",
    );
    expect(store.hasCapability("manage_content", 3)).toBe(false);

    store.setSession(
      { ...member, role_assignments: [{ role_code: "ADMIN", sig_id: null }] },
      "admin-token",
    );
    expect(store.hasCapability("administer")).toBe(true);
    expect(store.hasCapability("manage_operations", 999)).toBe(true);
  });
});
