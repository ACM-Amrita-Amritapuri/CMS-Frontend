import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { getDashboardSummary, listAdminMembers, listSigs } from "@/lib/api/admin";
import { getMe } from "@/lib/api/auth";
import { getCalendarRange, getEvent, getMyAttendance, listAttendance, listEvents, listMeetings } from "@/lib/api/club-operations";
import { getDocument, listDocuments, listRevisions, searchDocuments } from "@/lib/api/documentation";
import { getPath, getPathProgress, listPaths } from "@/lib/api/learning";
import { getMemberByRoll, getMyProfile, getPortfolio } from "@/lib/api/members";
import { getProject, listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";

const user = { id: 1, username: "member", roll_number: "M001", must_change_password: false, role_assignments: [] };
const reads: [string, (signal?: AbortSignal) => Promise<unknown>][] = [
  ["summary", (signal) => getDashboardSummary(signal)],
  ["admin members", (signal) => listAdminMembers({}, signal)],
  ["SIGs", (signal) => listSigs(undefined, signal)],
  ["me", (signal) => getMe(signal)],
  ["calendar", (signal) => getCalendarRange("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z", signal)],
  ["event", (signal) => getEvent(1, signal)],
  ["my attendance", (signal) => getMyAttendance(1, signal)],
  ["attendance", (signal) => listAttendance(1, undefined, signal)],
  ["events", (signal) => listEvents({}, signal)],
  ["meetings", (signal) => listMeetings({}, signal)],
  ["document", (signal) => getDocument(1, signal)],
  ["documents", (signal) => listDocuments(undefined, signal)],
  ["revisions", (signal) => listRevisions(1, signal)],
  ["search", (signal) => searchDocuments({ q: "test" }, signal)],
  ["path", (signal) => getPath(1, signal)],
  ["progress", (signal) => getPathProgress(1, signal)],
  ["paths", (signal) => listPaths(signal)],
  ["member", (signal) => getMemberByRoll("M001", signal)],
  ["profile", (signal) => getMyProfile(signal)],
  ["portfolio", (signal) => getPortfolio(1, signal)],
  ["project", (signal) => getProject(1, signal)],
  ["projects", (signal) => listProjects(undefined, signal)],
];

afterEach(() => vi.unstubAllGlobals());

describe.each(reads)("%s read contract", (_name, read) => {
  it("forwards the exact signal and supports the old call signature", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ user })));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await read(controller.signal);
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    await read();
    expect(fetchMock.mock.calls[1][1].signal).toBeUndefined();
  });

  it("rejects cancellation without retrying", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener("abort", () => reject(options.signal?.reason), { once: true });
    }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    const pending = read(controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

it("query cancellation aborts the underlying fetch and leaves no error cache", async () => {
  let signal: AbortSignal | null | undefined;
  vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
    signal = options.signal;
    signal?.addEventListener("abort", () => reject(signal?.reason), { once: true });
  })));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const key = queryKeys.learning.path("1");
  const pending = client.fetchQuery({ queryKey: key, queryFn: ({ signal }) => getPath(1, signal) }).catch(() => undefined);
  await client.cancelQueries({ queryKey: queryKeys.learning.path(1) });
  await pending;
  expect(signal?.aborted).toBe(true);
  expect(client.getQueryState(key)?.error).toBeNull();
  client.clear();
});
