import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeftIcon, CalendarX2Icon, MapPinIcon } from "lucide-react";

import {
  cancelEvent,
  getEvent,
  publishEvent,
  type ClubEvent,
} from "@/lib/api/club-operations";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDateTime } from "@/lib/formatters/date";
import { QueryErrorState } from "@/components/ui/async";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailRow, EmptyState } from "@/components/ui/table";

export default function EventDetailPage() {
  useDocumentTitle("Event");
  const { eventId } = useParams();
  const id = Number(eventId);
  const invalidId = !eventId || Number.isNaN(id);
  const query = useQuery({
    queryKey: ["operations", "event", invalidId ? eventId : id],
    queryFn: () => getEvent(id),
    retry: false,
    enabled: !invalidId,
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/operations">
          <ArrowLeftIcon /> Operations
        </Link>
      </Button>
      {invalidId ? (
        <EmptyState title="Event not found" description="This event does not exist." />
      ) : query.isPending ? (
        <div className="bg-muted h-64 animate-pulse rounded-lg" />
      ) : query.isError ? (
        <QueryErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        <EventDetail event={query.data} />
      )}
    </div>
  );
}

function EventDetail({ event }: { event: ClubEvent }) {
  const { hasCapability } = useSession();
  const manage = hasCapability("manage_operations");
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["operations"] });

  const publish = useMutation({
    mutationFn: () => publishEvent(event.id),
    onSuccess: () => {
      refresh();
      toast.success("Event published.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not publish."),
  });

  const cancel = useMutation({
    mutationFn: () => cancelEvent(event.id),
    onSuccess: () => {
      refresh();
      toast.success("Event cancelled.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not cancel."),
  });

  return (
    <article className="flex flex-col gap-6">
      <PageHeader
        title={event.title}
        description={event.description}
        meta={<StatusBadge status={event.state} />}
      />

      <dl className="flex flex-col gap-2">
        <DetailRow label="When">
          {formatDateTime(event.starts_at)} → {formatDateTime(event.ends_at)}
        </DetailRow>
        {event.location ? (
          <DetailRow label="Where">
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-3.5" /> {event.location}
            </span>
          </DetailRow>
        ) : null}
        <DetailRow label="Capacity">{event.capacity}</DetailRow>
      </dl>

      {manage ? (
      <section className="flex flex-wrap items-end gap-3 border-t pt-4">
          {event.state === "DRAFT" ? (
            <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
              Publish event
            </Button>
          ) : null}
          {event.state !== "CANCELLED" ? (
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm("Cancel this event?")) cancel.mutate();
              }}
              disabled={cancel.isPending}
            >
              <CalendarX2Icon /> Cancel event
            </Button>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
