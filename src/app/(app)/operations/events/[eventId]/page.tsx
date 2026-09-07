"use client";

import { use, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeftIcon, CalendarX2Icon, MapPinIcon, SendIcon, TicketIcon } from "lucide-react";

import {
  cancelEvent,
  cancelRegistration,
  getEvent,
  listAttendance,
  publishEvent,
  recordAttendance,
  registerForEvent,
  submitEventFeedback,
  type Registration,
} from "@/lib/api/club-operations";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/app/providers";
import { formatDateTime, parseUtc } from "@/lib/formatters/date";
import { QueryErrorState } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { DetailRow } from "@/components/ui/table";

export default function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const id = Number(eventId);
  const query = useQuery({
    queryKey: ["operations", "event", id],
    queryFn: () => getEvent(id),
    retry: false,
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/operations">
          <ArrowLeftIcon /> Operations
        </Link>
      </Button>
      {query.isPending ? (
        <div className="bg-muted h-64 animate-pulse rounded-xl" />
      ) : query.isError ? (
        <QueryErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        <EventDetail eventId={id} />
      )}
    </div>
  );
}

function EventDetail({ eventId }: { eventId: number }) {
  const { hasCapability } = useSession();
  // Subscribe to a once-per-minute tick so "has ended" stays current without
  // calling the impure Date.now during render.
  const now = useSyncExternalStore(
    (onStoreChange) => {
      const timer = setInterval(onStoreChange, 60_000);
      return () => clearInterval(timer);
    },
    () => Date.now(),
    () => 0,
  );

  const manage = hasCapability("manage_operations");
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["operations"] });

  const eventQuery = useQuery({
    queryKey: ["operations", "event", eventId],
    queryFn: () => getEvent(eventId),
  });
  const event = eventQuery.data;

  const attendanceQuery = useQuery({
    queryKey: ["operations", "attendance", eventId],
    queryFn: () => listAttendance(eventId),
    enabled: manage,
  });
  const attendance = attendanceQuery.data ?? [];

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [memberId, setMemberId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const register = useMutation({
    mutationFn: () => registerForEvent(eventId),
    onSuccess: (created) => {
      setRegistration(created);
      refresh();
      toast.success("You're registered.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not register."),
  });

  const unregister = useMutation({
    mutationFn: () => cancelRegistration(registration!.id),
    onSuccess: () => {
      setRegistration(null);
      refresh();
      toast.success("Registration cancelled.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not cancel registration."),
  });

  const publish = useMutation({
    mutationFn: () => publishEvent(eventId),
    onSuccess: () => {
      refresh();
      toast.success("Event published.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not publish."),
  });

  const cancel = useMutation({
    mutationFn: () => cancelEvent(eventId),
    onSuccess: () => {
      refresh();
      toast.success("Event cancelled.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not cancel."),
  });

  const attend = useMutation({
    mutationFn: () =>
      recordAttendance(eventId, {
        member_user_id: Number(memberId),
        method: "MANUAL",
      }),
    onSuccess: () => {
      refresh();
      setMemberId("");
      toast.success("Attendance recorded.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not record attendance."),
  });

  const feedback = useMutation({
    mutationFn: () =>
      submitEventFeedback(eventId, {
        rating: Number(rating),
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Thanks for the feedback!");
      setComment("");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not submit feedback."),
  });

  if (!event) return null;

  const endsAt = parseUtc(event.ends_at)?.getTime();
  const hasEnded = now > 0 && endsAt !== undefined && endsAt < now;
  const isFull = event.registered_count >= event.capacity;

  return (
    <article className="bg-card flex flex-col gap-5 rounded-xl border p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          {event.description ? (
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">{event.description}</p>
          ) : null}
        </div>
        <Badge variant={event.state === "PUBLISHED" ? "success" : event.state === "CANCELLED" ? "destructive" : "warning"}>
          {event.state.toLowerCase()}
        </Badge>
      </header>

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
        <DetailRow label="Capacity">
          {event.registered_count}/{event.capacity} registered
        </DetailRow>
      </dl>

      {/* Member actions */}
      {event.state === "PUBLISHED" && !hasEnded ? (
        <div className="border-t pt-4">
          {registration ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-success flex items-center gap-2 text-sm font-medium">
                <TicketIcon className="size-4" /> You&apos;re registered.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => unregister.mutate()}
                disabled={unregister.isPending}
              >
                Cancel registration
              </Button>
            </div>
          ) : (
            <Button onClick={() => register.mutate()} disabled={register.isPending || isFull}>
              <TicketIcon /> {isFull ? "Event full" : "Register"}
            </Button>
          )}
        </div>
      ) : null}

      {/* Feedback after the event ends */}
      {event.state === "PUBLISHED" && hasEnded ? (
        <section className="border-t pt-4">
          <h3 className="text-sm font-semibold">How was it?</h3>
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Rating (1–5)" htmlFor="fb-rating" className="w-32">
              <Input id="fb-rating" type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} />
            </Field>
            <Field label="Comment (optional)" htmlFor="fb-comment">
              <Textarea id="fb-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
            </Field>
            <Button className="w-fit" onClick={() => feedback.mutate()} disabled={feedback.isPending}>
              <SendIcon /> Send feedback
            </Button>
          </div>
        </section>
      ) : null}

      {/* Manager tools */}
      {manage ? (
        <section className="border-t flex flex-wrap items-end gap-3 pt-4">
          {event.state === "DRAFT" ? (
            <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
              Publish event
            </Button>
          ) : null}
          {event.state !== "CANCELLED" ? (
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm("Cancel this event? Members will no longer be able to register.")) {
                  cancel.mutate();
                }
              }}
              disabled={cancel.isPending}
            >
              <CalendarX2Icon /> Cancel event
            </Button>
          ) : null}
          <div className="flex items-end gap-2">
            <Field label="Record attendance (user id)" htmlFor="att-member" className="w-44">
              <Input id="att-member" type="number" min={1} value={memberId} onChange={(e) => setMemberId(e.target.value)} />
            </Field>
            <Button
              variant="outline"
              onClick={() => attend.mutate()}
              disabled={attend.isPending || !memberId}
            >
              Mark present
            </Button>
          </div>
        </section>
      ) : null}

      {manage && attendance.length > 0 ? (
        <section className="border-t pt-4">
          <h3 className="text-sm font-semibold">Attendance ({attendance.length})</h3>
          <ul className="text-muted-foreground mt-2 flex flex-wrap gap-2 text-xs">
            {attendance.map((record) => (
              <li key={record.id} className="bg-muted rounded-md px-2 py-1">
                member #{record.member_user_id} · {record.method.toLowerCase()}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
