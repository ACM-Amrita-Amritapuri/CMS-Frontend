import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CalendarX2Icon,
  ClipboardCheckIcon,
  MapPinIcon,
  UserMinusIcon,
} from "lucide-react";

import {
  cancelEvent,
  getEvent,
  getMyAttendance,
  listAttendance,
  markAttendance,
  publishEvent,
  removeAttendance,
  type ClubEvent,
} from "@/lib/api/club-operations";
import { normalizeId, queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDateTime } from "@/lib/formatters/date";
import { QueryState } from "@/components/ui/async";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/input";
import { PageHeader, SectionHeader } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailRow, EmptyState } from "@/components/ui/table";

export default function EventDetailPage() {
  useDocumentTitle("Event");
  const { eventId } = useParams();
  const id = Number(eventId);
  const invalidId = normalizeId(eventId) === null;
  const query = useQuery({
    queryKey: queryKeys.operations.event(eventId),
    queryFn: ({ signal }) => getEvent(id, signal),
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
      ) : (
        <QueryState query={query} notFound="Event not found">
          {(event) => <EventDetail event={event} />}
        </QueryState>
      )}
    </div>
  );
}

function EventDetail({ event }: { event: ClubEvent }) {
  const { hasCapability } = useSession();
  const manage = hasCapability("manage_operations");
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.all });

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
      setConfirmCancel(false);
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
              onClick={() => setConfirmCancel(true)}
              disabled={cancel.isPending}
            >
              <CalendarX2Icon /> Cancel event
            </Button>
          ) : null}
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={`Cancel "${event.title}"?`}
        description="Cancelled events stay visible but cannot take attendance. This can be reversed only by creating a new event."
        confirmLabel="Cancel event"
        variant="destructive"
        pending={cancel.isPending}
        onConfirm={() => cancel.mutate()}
      />

      <AttendanceSection event={event} manage={manage} />
    </article>
  );
}

function AttendanceSection({ event, manage }: { event: ClubEvent; manage: boolean }) {
  if (manage) return <ManagerAttendance event={event} />;
  return <MemberAttendance eventId={event.id} />;
}

function ManagerAttendance({ event }: { event: ClubEvent }) {
  const queryClient = useQueryClient();
  const [identifier, setIdentifier] = useState("");
  const [removing, setRemoving] = useState<{ userId: number; label: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: queryKeys.operations.attendanceList(event.id),
    queryFn: ({ signal }) => listAttendance(event.id, undefined, signal),
    enabled: event.state === "PUBLISHED",
    retry: false,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.operations.attendance(event.id) });

  const mark = useMutation({
    mutationFn: (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) throw new Error("Enter a roll number, username, or user ID.");
      const asId = Number(trimmed);
      if (/^\d+$/.test(trimmed)) return markAttendance(event.id, { user_id: asId });
      if (/^[A-Za-z0-9@._-]+$/.test(trimmed) && trimmed.includes("@") === false && /[A-Za-z]/.test(trimmed) && trimmed.length <= 64) {
        return markAttendance(event.id, { username: trimmed }).catch(() =>
          markAttendance(event.id, { roll_number: trimmed }),
        );
      }
      return markAttendance(event.id, { roll_number: trimmed });
    },
    onSuccess: () => {
      setIdentifier("");
      setFormError(null);
      refresh();
      toast.success("Attendance marked.");
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : (error as Error).message ?? "Could not mark attendance."),
  });

  const remove = useMutation({
    mutationFn: (userId: number) => removeAttendance(event.id, userId),
    onSuccess: () => {
      setRemoving(null);
      refresh();
      toast.success("Attendance removed.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not remove attendance."),
  });

  if (event.state !== "PUBLISHED") {
    return (
      <section aria-label="Attendance" className="flex flex-col gap-3 border-t pt-4">
        <SectionHeader
          title="Attendance"
          description="Publish this event before marking attendance."
        />
        <EmptyState
          title="Attendance unlocks after publish"
          description="Draft and cancelled events cannot take attendance."
        />
      </section>
    );
  }

  return (
    <section aria-label="Attendance" className="flex flex-col gap-4 border-t pt-4">
      <SectionHeader
        title="Attendance"
        description={
          query.data
            ? `${query.data.present_count} present · capacity ${query.data.capacity ?? event.capacity}`
            : "Mark members present with a roll number, username, or user ID."
        }
      />

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          mark.mutate(identifier);
        }}
        noValidate
      >
        <div className="flex-1">
          <Field label="Member roll number, username, or ID" htmlFor="attendance-id" error={formError ?? undefined}>
            <Input
              id="attendance-id"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 22BCE1234"
              autoComplete="off"
            />
          </Field>
        </div>
        <Button type="submit" disabled={mark.isPending || !identifier.trim()}>
          <ClipboardCheckIcon /> Mark present
        </Button>
      </form>

      <QueryState
        query={query}
        notFound="Attendance not found"
        isEmpty={(data) => data.attendance.length === 0}
        empty={{ title: "No attendance yet", description: "Marked members will appear here with their roll number." }}
      >
        {(data) => (
        <ul className="divide-border overflow-hidden rounded-md border">
          {data.attendance.map((record) => (
            <li key={record.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {record.username ?? `User ${record.user_id}`}
                </p>
                <p className="text-muted-foreground font-mono text-xs">
                  {record.roll_number ?? `#${record.user_id}`}
                </p>
              </div>
              <StatusBadge status={record.status} />
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove attendance for ${record.username ?? record.user_id}`}
                onClick={() =>
                  setRemoving({
                    userId: record.user_id,
                    label: record.username ?? record.roll_number ?? String(record.user_id),
                  })
                }
              >
                <UserMinusIcon />
              </Button>
            </li>
          ))}
        </ul>
        )}
      </QueryState>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={removing ? `Remove ${removing.label} from attendance?` : "Remove attendance?"}
        description="The member will no longer count toward the present total."
        confirmLabel="Remove"
        variant="destructive"
        pending={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.userId)}
      />
    </section>
  );
}

function MemberAttendance({ eventId }: { eventId: number }) {
  const query = useQuery({
    queryKey: queryKeys.operations.myAttendance(eventId),
    queryFn: ({ signal }) => getMyAttendance(eventId, signal),
    retry: false,
  });

  return (
    <QueryState query={query} notFound="Attendance not found">
      {(data) => (
    <section aria-label="My attendance" className="border-t pt-4">
      <p className="text-sm">
        {data.present ? (
          <span className="inline-flex items-center gap-2">
            <ClipboardCheckIcon className="size-4" /> You are marked present for this event.
          </span>
        ) : (
          <span className="text-muted-foreground">
            You are not marked present. Ask an operations manager to check you in.
          </span>
        )}
      </p>
    </section>
      )}
    </QueryState>
  );
}
