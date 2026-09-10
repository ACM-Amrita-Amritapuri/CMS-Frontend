import { describe, expect, it } from "vitest";

import { parseUtc } from "@/lib/formatters/date";

describe("parseUtc", () => {
  it("parses naive UTC and explicit-offset timestamps consistently", () => {
    expect(parseUtc("2026-09-07T12:00:00")?.toISOString()).toBe("2026-09-07T12:00:00.000Z");
    expect(parseUtc("2026-09-07T14:00:00+02:00")?.toISOString()).toBe("2026-09-07T12:00:00.000Z");
  });
});
