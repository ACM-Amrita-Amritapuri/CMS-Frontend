import { useQuery } from "@tanstack/react-query";
import { CalendarDaysIcon, ExternalLinkIcon, MapPinIcon, TrophyIcon } from "lucide-react";

import { queryKeys } from "@/lib/query-keys";
import { listEvents, type ClubEvent } from "@/lib/api/club-operations";
import { parseUtc, formatDateTime } from "@/lib/formatters/date";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionHeader } from "@/components/ui/page";

export function selectUpcomingEvents(events: ClubEvent[], now = new Date()) {
  return [...events]
    .filter((event) => {
      const startsAt = parseUtc(event.starts_at);
      return event.kind !== "MEETING" && event.state === "PUBLISHED" && startsAt !== null && startsAt > now;
    })
    .sort((a, b) => (parseUtc(a.starts_at)?.getTime() ?? 0) - (parseUtc(b.starts_at)?.getTime() ?? 0));
}

export default function HackathonsPage() {
  useDocumentTitle("Events");
  const eventsQuery = useQuery({
    queryKey: queryKeys.operations.events(),
    queryFn: ({ signal }) => listEvents({ limit: 100 }, signal),
    select: selectUpcomingEvents,
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Events"
        eyebrow={<span className="inline-flex items-center gap-2"><TrophyIcon className="size-4" /> Build, compete, and ship</span>}
        description="Find the next hackathon, CTF, or club event and register in a few clicks."
      />

      <section aria-label="Upcoming events" className="flex min-w-0 flex-col gap-5">
        <SectionHeader title="Upcoming events" description="Save your spot before registration closes." />

        <AsyncBoundary
          query={eventsQuery}
          isEmpty={(events) => events.length === 0}
          empty={{ icon: CalendarDaysIcon, title: "No upcoming events" }}
        >
          {(events) => (
            <ul className="grid gap-4 md:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </section>
    </div>
  );
}

function EventCard({ event }: { event: ClubEvent }) {
  const registrationUrl = httpUrl(event.external_url);
  const kind = event.kind === "CTF" ? "CTF" : event.kind === "HACKATHON" ? "Hackathon" : "Event";

  return (
    <li className="bg-card flex h-full min-w-0 flex-col gap-5 rounded-xl border p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge variant="outline">{kind}</Badge>
          <h3 className="mt-3 break-words text-lg font-semibold leading-7 [overflow-wrap:anywhere]">{event.title}</h3>
        </div>
        <CalendarDaysIcon className="text-primary mt-1 size-5 shrink-0" aria-hidden />
      </div>

      {event.description ? (
        <p className="text-muted-foreground line-clamp-3 break-words text-sm leading-6 [overflow-wrap:anywhere]">{event.description}</p>
      ) : null}

      <dl className="text-muted-foreground flex min-w-0 flex-col gap-3 text-sm leading-6 [overflow-wrap:anywhere]">
        <div className="flex items-start gap-2">
          <CalendarDaysIcon className="text-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <dt className="sr-only">Date and time</dt>
            <dd>{formatDateTime(event.starts_at)}</dd>
          </div>
        </div>
        {event.location ? (
          <div className="flex items-start gap-2">
            <MapPinIcon className="text-foreground mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <dt className="sr-only">Location</dt>
              <dd>{event.location}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto border-t pt-4">
        {registrationUrl ? (
          <a
            href={registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
          >
            Register now <ExternalLinkIcon className="size-4" />
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">Registration link coming soon</span>
        )}
      </div>
    </li>
  );
}

function httpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
