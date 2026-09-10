import { describe, expect, it } from "vitest";

import { selectUpcomingEvents } from "@/pages/HackathonsPage";
import type { ClubEvent } from "@/lib/api/club-operations";

const event = (overrides: Partial<ClubEvent>): ClubEvent => ({
  id: 1,
  title: "Hackathon",
  description: "Build something useful.",
  sig_id: null,
  owner_user_id: 1,
  starts_at: "2026-10-01T10:00:00",
  ends_at: "2026-10-01T18:00:00",
  location: "Lab 1",
  external_url: "https://example.com/register",
  capacity: 100,
  kind: "EVENT",
  state: "PUBLISHED",
  published_at: "2026-09-01T10:00:00",
  cancelled_at: null,
  ...overrides,
});

describe("selectUpcomingEvents", () => {
  it("keeps future published events and sorts them by start time", () => {
    const now = new Date("2026-09-10T00:00:00Z");

    expect(
      selectUpcomingEvents(
        [
          event({ id: 1 }),
          event({ id: 2, starts_at: "2026-10-03T10:00:00" }),
          event({ id: 3, starts_at: "2026-09-01T10:00:00" }),
          event({ id: 4, state: "DRAFT" }),
          event({ id: 5, state: "CANCELLED" }),
          event({ id: 6, starts_at: "2026-09-20T10:00:00" }),
        ],
        now,
      ).map(({ id }) => id),
    ).toEqual([6, 1, 2]);
  });
});
