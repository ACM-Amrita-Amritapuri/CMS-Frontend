/**
 * Backend timestamps are naive UTC ISO strings ("2026-09-05T18:00:00").
 * Parse them as UTC, render in the viewer's local timezone.
 * Outbound form values must be ISO-8601 with an explicit offset.
 */

export function parseUtc(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseUtc(value);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(value: string | null | undefined): string {
  const date = parseUtc(value);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

/** Local datetime-local input value → ISO-8601 with offset. */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
