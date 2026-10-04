import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from "lucide-react";

import { getCalendarRange } from "@/lib/api/club-operations";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime, parseUtc } from "@/lib/formatters/date";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";

export function monthBounds(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
  };
}

export default function CalendarPage() {
  useDocumentTitle("Calendar");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const bounds = monthBounds(cursor.year, cursor.month);
  const query = useQuery({
    queryKey: queryKeys.operations.calendar(bounds.start, bounds.end),
    queryFn: ({ signal }) => getCalendarRange(bounds.start, bounds.end, signal),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        description="Events and meetings across the club, month by month."
        actions={
          <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous month"
            onClick={() =>
              setCursor(({ year, month }) =>
                month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
              )
            }
          ><ChevronLeftIcon /></Button>
          <span className="min-w-0 flex-1 text-center text-sm font-semibold tabular-nums sm:min-w-36">{bounds.label}</span>
          <Button
            variant="outline"
            size="sm"
            aria-label="Next month"
            onClick={() =>
              setCursor(({ year, month }) =>
                month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
              )
            }
          ><ChevronRightIcon /></Button>
        </div>
        }
      />

      <AsyncBoundary
        query={query}
        isEmpty={(events) => events.length === 0}
        empty={{
          icon: CalendarDaysIcon,
          title: `Nothing scheduled in ${bounds.label}`,
          description: "Events and meetings in this month will appear here.",
        }}
      >
        {(events) => (
          <ul className="flex flex-col gap-2">
            {[...events]
              .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
              .map((event) => (
                <li key={event.id}>
                  <Link
                    to={`/operations/events/${event.id}`}
                    className="hover:border-primary grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border p-4 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                  >
                    <div className="bg-primary/10 text-primary flex size-12 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-bold">
                      <span>{parseUtc(event.starts_at)?.toLocaleDateString(undefined, { month: "short" }) ?? "—"}</span>
                      <span className="text-base leading-none">{parseUtc(event.starts_at)?.getDate() ?? "—"}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-5 font-semibold wrap-anywhere">{event.title}</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-5 wrap-anywhere">
                        {formatDateTime(event.starts_at)}
                        {event.location ? (
                          <span className="ml-1 inline wrap-anywhere">
                            {" "}
                            · <MapPinIcon className="inline size-3 align-middle" /> {event.location}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    {event.kind === "MEETING" || event.state === "CANCELLED" ? (
                      <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:justify-end">
                        {event.kind === "MEETING" ? <Badge variant="info">meeting</Badge> : null}
                        {event.state === "CANCELLED" ? <StatusBadge status="CANCELLED" /> : null}
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </AsyncBoundary>

      <p className="text-muted-foreground text-xs">
        Times are shown in your local timezone.{" "}
        <Link to="/operations" className="text-primary hover:underline">
          Back to operations
        </Link>
      </p>
    </div>
  );
}
