import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logout, logoutAll } from "@/lib/api/auth";
import { apiRequest } from "@/lib/api/client";
import { sessionStore } from "@/lib/auth/session-store";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  sessionStore.setSession(
    {
      id: 1,
      username: "member",
      roll_number: "M001",
      must_change_password: false,
      role_assignments: [],
    },
    "test-access-token",
  );
});

afterEach(() => {
  sessionStore.clearSession();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe.each([
  ["logout", logout],
  ["logoutAll", logoutAll],
] as const)("%s", (_name, signOut) => {
  it("clears the local session after successful revocation", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: "Logged out" }));

    await expect(signOut()).resolves.toEqual({ message: "Logged out" });

    expect(sessionStore.getSnapshot()).toEqual({ user: null, accessToken: null });
  });

  it("clears the local session and preserves network failures", async () => {
    const error = new TypeError("Network unavailable");
    fetchMock.mockRejectedValueOnce(error);

    await expect(signOut()).rejects.toBe(error);

    expect(sessionStore.getSnapshot()).toEqual({ user: null, accessToken: null });
  });

  it("clears the local session without retrying rejected revocation", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    }, { status: 401 }));

    await expect(signOut()).rejects.toMatchObject({ status: 401 });

    expect(sessionStore.getSnapshot()).toEqual({ user: null, accessToken: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

it.each([false, true])("does not restore an obsolete session after refresh (new login: %s)", async (newLogin) => {
  let finishRefresh!: (response: Response) => void;
  fetchMock.mockResolvedValueOnce(Response.json({}, { status: 401 }));
  fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => {
    finishRefresh = resolve;
  }));
  const request = apiRequest("/members/me");
  const rejected = expect(request).rejects.toMatchObject({ code: "SESSION_CHANGED" });
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

  const user = sessionStore.getSnapshot().user!;
  sessionStore.clearSession();
  if (newLogin) sessionStore.setSession(user, "new-login-token");
  finishRefresh(Response.json({ access_token: "obsolete-token" }));
  await rejected;

  expect(sessionStore.getSnapshot().accessToken).toBe(newLogin ? "new-login-token" : null);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("authenticates logout-all with the current bearer token", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ message: "Logged out" }));

  await logoutAll();

  const [url, options] = fetchMock.mock.calls[0];
  expect(String(url)).toMatch(/\/auth\/logout-all$/);
  expect(options?.method).toBe("POST");
  expect(options?.credentials).toBe("include");
  expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer test-access-token");
});
