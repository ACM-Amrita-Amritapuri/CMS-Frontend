import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDaysIcon, MapPinIcon } from "lucide-react";

import { getCalendarRange } from "@/lib/api/club-operations";
import { formatDateTime, parseUtc } from "@/lib/formatters/date";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function monthBounds(year: number, month: number) {
  const start = new Date(year, month, 1, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return {
    start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}T00:00:00`,
    end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}T23:59:59`,
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
    queryKey: ["operations", "calendar", bounds.start],
    queryFn: () => getCalendarRange(bounds.start, bounds.end),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Events and meetings across the club, month by month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCursor(({ year, month }) =>
                month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
              )
            }
          >
            ←
          </Button>
          <span className="min-w-36 text-center text-sm font-medium">{bounds.label}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCursor(({ year, month }) =>
                month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
              )
            }
          >
            →
          </Button>
        </div>
      </header>

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
                    className="hover:border-primary flex items-center gap-4 rounded-lg border p-4 transition-colors"
                  >
                    <div className="bg-primary/10 text-primary flex size-12 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-bold">
                      <span>{parseUtc(event.starts_at)?.toLocaleDateString(undefined, { month: "short" }) ?? "—"}</span>
                      <span className="text-base leading-none">{parseUtc(event.starts_at)?.getDate() ?? "—"}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{event.title}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {formatDateTime(event.starts_at)}
                        {event.location ? (
                          <span className="inline-flex items-center gap-1">
                            {" "}
                            · <MapPinIcon className="size-3" /> {event.location}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    {event.kind === "MEETING" ? <Badge variant="info">meeting</Badge> : null}
                    {event.state === "CANCELLED" ? <Badge variant="destructive">cancelled</Badge> : null}
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
