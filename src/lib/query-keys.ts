type EntityId = number | string | null | undefined;

export function normalizeId(value: EntityId): number | null {
  if (typeof value === "string" && !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export const queryKeys = {
  sigs: {
    all: ["sigs"] as const,
    list: (limit = 100) => ["sigs", "list", limit] as const,
  },
  admin: {
    dashboard: ["admin", "dashboard"] as const,
    members: ["admin", "members"] as const,
    memberList: (active: string, sig: string, search: string, limit: number, offset: number) =>
      ["admin", "members", { active, sig, search, limit, offset }] as const,
  },
  profile: {
    all: ["profile"] as const,
    me: ["profile", "me"] as const,
  },
  member: (roll: string | null | undefined) => ["member", roll ?? ""] as const,
  portfolio: {
    all: ["portfolio"] as const,
    detail: (id: EntityId) => ["portfolio", normalizeId(id)] as const,
  },
  learning: {
    all: ["learning"] as const,
    paths: ["learning", "paths"] as const,
    path: (id: EntityId) => ["learning", "path", normalizeId(id)] as const,
    progress: (id: EntityId) => ["learning", "progress", normalizeId(id)] as const,
    mySubmission: (id: EntityId) => ["learning", "assignment", normalizeId(id), "submission"] as const,
    submissions: (id: EntityId) => ["learning", "assignment", normalizeId(id), "submissions"] as const,
  },
  projects: {
    directory: (limit = 50, offset = 0) => ["projects", "directory", { limit, offset }] as const,
  },
  documentation: {
    all: ["documentation"] as const,
    lists: ["documentation", "list"] as const,
    searches: ["documentation", "search"] as const,
    list: (limit = 20, offset = 0) => ["documentation", "list", { limit, offset }] as const,
    search: (q: string, limit = 20, offset = 0) => ["documentation", "search", { q, limit, offset }] as const,
    detail: (id: EntityId) => ["documentation", "document", normalizeId(id)] as const,
    revisions: (id: EntityId) => ["documentation", "revisions", normalizeId(id)] as const,
  },
  operations: {
    all: ["operations"] as const,
    eventLists: ["operations", "events"] as const,
    meetingLists: ["operations", "meetings"] as const,
    calendars: ["operations", "calendar"] as const,
    events: (includeDrafts = false, limit = 50, offset = 0) => ["operations", "events", { includeDrafts, limit, offset }] as const,
    meetings: (includeDrafts = false, limit = 50, offset = 0) => ["operations", "meetings", { includeDrafts, limit, offset }] as const,
    event: (id: EntityId) => ["operations", "event", normalizeId(id)] as const,
    meeting: (id: EntityId) => ["operations", "meeting", normalizeId(id)] as const,
    calendar: (start: string, end: string, limit = 50, offset = 0) => ["operations", "calendar", start, end, { limit, offset }] as const,
    attendance: (id: EntityId) => ["operations", "event", normalizeId(id), "attendance"] as const,
    attendanceList: (id: EntityId, limit = 20, offset = 0) => ["operations", "event", normalizeId(id), "attendance", "list", { limit, offset }] as const,
    myAttendance: (id: EntityId) => ["operations", "event", normalizeId(id), "attendance", "me"] as const,
  },
};
