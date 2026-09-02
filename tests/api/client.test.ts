import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/client";
import { sessionStore } from "@/lib/auth/session-store";

const user = {
  id: 7,
  username: "member",
  roll_number: "A7",
  must_change_password: false,
  role_assignments: [],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status = 204) {
  return new Response(null, { status });
}

describe("apiRequest", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    sessionStore.clearSession();
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON with credentials and parses a JSON response", async () => {
    sessionStore.setSession(user, "access-token");
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await expect(
      apiRequest<{ ok: boolean }>("/members/me", {
        method: "PUT",
        body: { real_name: "Member" },
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/members/me",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ real_name: "Member" }),
        headers: expect.any(Headers),
      }),
    );
    const requestHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(requestHeaders.get("Content-Type")).toBe("application/json");
    expect(requestHeaders.get("Authorization")).toBe("Bearer access-token");
  });

  it("treats a successful empty body as undefined", async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse());

    await expect(apiRequest<void>("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("refreshes once and retries a protected request after a 401", async () => {
    sessionStore.setSession(user, "expired-token");
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED", message: "expired" } }, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: "fresh-token", token_type: "Bearer" }))
      .mockResolvedValueOnce(jsonResponse({ user }));

    await expect(apiRequest<{ user: typeof user }>("/auth/me")).resolves.toEqual({ user });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sessionStore.getSnapshot().accessToken).toBe("fresh-token");
    const retryHeaders = new Headers(fetchMock.mock.calls[2]?.[1]?.headers);
    expect(retryHeaders.get("Authorization")).toBe("Bearer fresh-token");
  });

  it("shares one refresh request between concurrent 401s", async () => {
    sessionStore.setSession(user, "expired-token");
    let resolveRefresh!: (response: Response) => void;
    const refreshResponse = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED", message: "expired" } }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED", message: "expired" } }, 401))
      .mockReturnValueOnce(refreshResponse)
      .mockResolvedValueOnce(jsonResponse({ ok: "first" }))
      .mockResolvedValueOnce(jsonResponse({ ok: "second" }));

    const first = apiRequest<{ ok: string }>("/members/me");
    const second = apiRequest<{ ok: string }>("/members/me");
    await Promise.resolve();
    await Promise.resolve();
    resolveRefresh(jsonResponse({ access_token: "fresh-token", token_type: "Bearer" }));

    await expect(Promise.all([first, second])).resolves.toEqual([
      { ok: "first" },
      { ok: "second" },
    ]);
    expect(
      fetchMock.mock.calls.filter(([path]) => path === "/auth/refresh"),
    ).toHaveLength(1);
  });

  it("clears the session when refresh fails", async () => {
    sessionStore.setSession(user, "expired-token");
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED", message: "expired" } }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED", message: "no session" } }, 401));

    await expect(apiRequest("/members/me")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
    expect(sessionStore.getSnapshot()).toEqual({ accessToken: null, user: null });
  });

  it.each([409, 422])("preserves %s field details without retrying", async (status) => {
    sessionStore.setSession(user, "access-token");
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: status === 409 ? "CONFLICT" : "VALIDATION_ERROR",
            message: "Fix the form",
            details: { real_name: "Already used" },
          },
        },
        status,
      ),
    );

    const result = apiRequest("/members/me");
    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({
      status,
      details: { real_name: "Already used" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
