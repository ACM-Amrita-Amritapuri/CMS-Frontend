import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { normalizeId, queryKeys } from "@/lib/query-keys";

describe("query keys", () => {
  it.each([undefined, null, "", " ", "abc", "1e2", "1.5", "-1", "Infinity", 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid entity ID %s", (id) => {
    expect(normalizeId(id)).toBeNull();
  });

  it("shares numeric route IDs with mutation invalidations", async () => {
    const client = new QueryClient();
    client.setQueryData(queryKeys.learning.path("007"), { title: "Cached path" });
    client.setQueryData(queryKeys.learning.progress("7"), { percent_complete: 0 });
    await client.invalidateQueries({ queryKey: queryKeys.learning.path(7) });
    await client.invalidateQueries({ queryKey: queryKeys.learning.progress(7) });
    expect(client.getQueryState(queryKeys.learning.path("7"))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.learning.progress(7))?.isInvalidated).toBe(true);
    expect(queryKeys.portfolio.detail("7")).toEqual(queryKeys.portfolio.detail(7));
    expect(queryKeys.documentation.detail("7")).toEqual(queryKeys.documentation.detail(7));
    client.clear();
  });

  it("invalidates every SIG list and both attendance views by prefix", async () => {
    const client = new QueryClient();
    const keys = [queryKeys.sigs.list(), queryKeys.sigs.list(10), queryKeys.operations.attendanceList(7), queryKeys.operations.myAttendance("7")];
    keys.forEach((key) => client.setQueryData(key, []));
    await client.invalidateQueries({ queryKey: queryKeys.sigs.all });
    await client.invalidateQueries({ queryKey: queryKeys.operations.attendance(7) });
    keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    client.clear();
  });

  it("separates request filters and both calendar boundaries", () => {
    expect(queryKeys.operations.events()).not.toEqual(queryKeys.operations.events(true));
    expect(queryKeys.operations.events(false, 10)).not.toEqual(queryKeys.operations.events());
    expect(queryKeys.operations.calendar("start", "end")).not.toEqual(queryKeys.operations.calendar("start", "other"));
  });
});
