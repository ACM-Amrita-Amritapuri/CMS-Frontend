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

const relativeUnits: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536e6],
  ["month", 2592e6],
  ["week", 6048e5],
  ["day", 864e5],
  ["hour", 36e5],
  ["minute", 6e4],
];

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

export function formatRelative(value: string | null | undefined): string {
  const date = parseUtc(value);
  if (!date) return "—";
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, ms] of relativeUnits) {
    if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return "just now";
}

/** Local datetime-local input value → ISO-8601 with offset. */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
