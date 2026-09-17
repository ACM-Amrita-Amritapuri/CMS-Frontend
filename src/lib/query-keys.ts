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
    memberList: (active: string) => ["admin", "members", active] as const,
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
  },
  projects: {
    all: ["projects"] as const,
    list: (limit = 100) => ["projects", "list", limit] as const,
    detail: (id: EntityId) => ["projects", "detail", normalizeId(id)] as const,
  },
  documentation: {
    all: ["documentation"] as const,
    list: (limit = 100) => ["documentation", "list", limit] as const,
    search: (q: string) => ["documentation", "search", q] as const,
    detail: (id: EntityId) => ["documentation", "document", normalizeId(id)] as const,
    revisions: (id: EntityId) => ["documentation", "revisions", normalizeId(id)] as const,
  },
  operations: {
    all: ["operations"] as const,
    events: (includeDrafts = false, limit = 100) => ["operations", "events", { includeDrafts, limit }] as const,
    meetings: (includeDrafts = false, limit = 100) => ["operations", "meetings", { includeDrafts, limit }] as const,
    event: (id: EntityId) => ["operations", "event", normalizeId(id)] as const,
    calendar: (start: string, end: string) => ["operations", "calendar", start, end] as const,
    attendance: (id: EntityId) => ["operations", "event", normalizeId(id), "attendance"] as const,
    attendanceList: (id: EntityId, limit = 100) => ["operations", "event", normalizeId(id), "attendance", "list", limit] as const,
    myAttendance: (id: EntityId) => ["operations", "event", normalizeId(id), "attendance", "me"] as const,
  },
};
