import { expect, it } from "vitest";
import { monthBounds } from "@/pages/operations/CalendarPage";

it.each([[2026, 2], [2026, 10], [2024, 1], [2026, 11], [2027, 0], [2028, 0]])("serializes the full local month as UTC instants: %s/%s", (year, month) => {
  const bounds = monthBounds(year, month);
  expect(bounds.start.endsWith("Z")).toBe(true);
  expect(bounds.end.endsWith("Z")).toBe(true);
  const start = new Date(bounds.start);
  const end = new Date(bounds.end);
  expect(start.getFullYear()).toBe(year);
  expect(start.getMonth()).toBe(month);
  expect(start.getDate()).toBe(1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  expect(end.getFullYear()).toBe(year);
  expect(end.getMonth()).toBe(month);
  expect(end.getDate()).toBe(lastDay);
  expect(end.getHours()).toBe(23);
  expect(end.getMinutes()).toBe(59);
  expect(end.getSeconds()).toBe(59);
  expect(end.getMilliseconds()).toBe(999);
  expect(start.getTime()).toBeLessThan(end.getTime());
});
