import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/lib/api/client";
import { sessionStore } from "@/lib/auth/session-store";

const user = {
  id: 7,
  username: "member",
  roll_number: "A7",
  must_change_password: false,
  role_assignments: [],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("apiRequest", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    sessionStore.clearSession();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("sends credentials and the in-memory bearer token", async () => {
    sessionStore.setSession(user, "access-token");
    fetchMock.mockResolvedValueOnce(json({ ok: true }));

    await expect(apiRequest<{ ok: boolean }>("/members/me")).resolves.toEqual({ ok: true });

    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(init?.credentials).toBe("include");
    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("refreshes once and retries a protected request after a 401", async () => {
    sessionStore.setSession(user, "expired-token");
    fetchMock
      .mockResolvedValueOnce(json({ error: { code: "UNAUTHORIZED" } }, 401))
      .mockResolvedValueOnce(json({ access_token: "fresh-token" }))
      .mockResolvedValueOnce(json({ ok: true }));

    await expect(apiRequest<{ ok: boolean }>("/members/me")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sessionStore.getSnapshot().accessToken).toBe("fresh-token");
  });
});
