import { afterEach, expect, it, vi } from "vitest";
import { getMe, login, refreshSession } from "@/lib/api/auth";
import { apiRequest } from "@/lib/api/client";
import { sessionStore } from "@/lib/auth/session-store";

const user = { id: 1, username: "member", roll_number: "M001", must_change_password: false, role_assignments: [{ role_code: "MEMBER", sig_id: null }] };

afterEach(() => { sessionStore.clearSession(); vi.unstubAllGlobals(); });

it.each([
  { access_token: "", token_type: "Bearer", user },
  { access_token: 42, token_type: "Bearer", user },
  { access_token: "token", token_type: "Bearer", user: { ...user, must_change_password: "false" } },
  { access_token: "token", token_type: "Bearer", user: { ...user, role_assignments: [{ role_code: "UNKNOWN", sig_id: null }] } },
])("rejects malformed login payloads without exposing their contents", async (payload) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));
  await expect(login({ login: "member", password: "password" })).rejects.toMatchObject({ status: 502, code: "INVALID_RESPONSE", message: "The server returned an invalid authentication response." });
  expect(sessionStore.getSnapshot().accessToken).toBeNull();
});

it("accepts valid auth payloads with additive fields", async () => {
  const payload = { access_token: "token", token_type: "Bearer", user: { ...user, extra: true }, extra: true };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));
  await expect(login({ login: "member", password: "password" })).resolves.toEqual(payload);
});

it("validates the current user response", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ user: { ...user, id: "1" } })));
  await expect(getMe()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
});

it("validates explicit and automatic refresh responses", async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ access_token: [] }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(refreshSession()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  sessionStore.setAccessToken("old-token");
  fetchMock.mockResolvedValueOnce(Response.json({}, { status: 401 })).mockResolvedValueOnce(Response.json({ access_token: true, token_type: "Bearer" }));
  await expect(apiRequest("/members/me")).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  expect(sessionStore.getSnapshot().accessToken).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it("does not replay a cancelled read after a shared refresh", async () => {
  sessionStore.setAccessToken("old-token");
  let resolve!: (response: Response) => void;
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({}, { status: 401 })).mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done; }));
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();
  const pending = apiRequest("/members/me", { signal: controller.signal });
  const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  controller.abort();
  resolve(Response.json({ access_token: "new-token", token_type: "Bearer" }));
  await assertion;
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(sessionStore.getSnapshot().accessToken).toBe("new-token");
});
