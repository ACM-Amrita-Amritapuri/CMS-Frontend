import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDaysIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";
import { z } from "zod";

import {
  createEvent,
  createMeeting,
  listEvents,
  listMeetings,
  type PublicEventKind,
} from "@/lib/api/club-operations";
import { listSigs } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/errors";
import { localInputToIso } from "@/lib/formatters/date";
import { parseForm } from "@/lib/form-validation";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/formatters/date";

const eventSchema = z.object({
  title: z.string().min(1, "Enter a title."),
  capacity: z.coerce.number().int().min(1, "Capacity is 1–10000.").max(10000, "Capacity is 1–10000."),
  starts_at: z.string().min(1, "Pick a start time."),
  ends_at: z.string().min(1, "Pick an end time."),
});

export default function OperationsPage() {
  useDocumentTitle("Operations");
  const { hasCapability } = useSession();
  const manage = hasCapability("manage_operations");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  const eventsQuery = useQuery({
    queryKey: queryKeys.operations.events(manage),
    queryFn: ({ signal }) => listEvents({ includeDrafts: manage }, signal),
  });
  const meetingsQuery = useQuery({
    queryKey: queryKeys.operations.meetings(manage),
    queryFn: ({ signal }) => listMeetings({ includeDrafts: manage }, signal),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Operations"
        description="Plan events and meetings for the club."
        actions={manage ? (
          <div className="flex gap-2">
            <Button onClick={() => setCreatingEvent(true)}>
              <PlusIcon /> New event
            </Button>
            <Button variant="outline" onClick={() => setCreatingMeeting(true)}>
              <CalendarDaysIcon /> New meeting
            </Button>
          </div>
        ) : null}
      />

      <Tabs defaultValue="events">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
          </TabsList>
          <Button asChild variant="ghost" size="sm">
            <Link to="/operations/calendar">
              <CalendarDaysIcon /> Calendar
            </Link>
          </Button>
        </div>

        <TabsContent value="events">
          <AsyncBoundary
            query={eventsQuery}
            isEmpty={(events) => events.length === 0}
            empty={{ icon: CalendarDaysIcon, title: "No events yet" }}
          >
            {(events) => (
              <ul className="divide-border overflow-hidden rounded-md border">
                {events.map((event) => (
                  <li key={event.id}>
                    <Link
                      to={`/operations/events/${event.id}`}
                      className="hover:bg-muted/30 flex items-center gap-4 p-4 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold">{event.title}</h2>
                          <EventStateBadge state={event.state} />
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatDateTime(event.starts_at)}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                        <UsersIcon className="size-3.5" /> {event.capacity}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AsyncBoundary>
        </TabsContent>

        <TabsContent value="meetings">
          <AsyncBoundary
            query={meetingsQuery}
            isEmpty={(meetings) => meetings.length === 0}
            empty={{ icon: UsersIcon, title: "No meetings scheduled" }}
          >
            {(meetings) => (
              <ul className="divide-border overflow-hidden rounded-md border">
                {meetings.map((meeting) => (
                  <li key={meeting.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold">{meeting.event.title}</h2>
                        <p className="text-muted-foreground text-xs">
                          {formatDateTime(meeting.event.starts_at)}
                          {meeting.event.location ? ` · ${meeting.event.location}` : ""}
                        </p>
                      </div>
                      <EventStateBadge state={meeting.event.state} />
                    </div>
                    {meeting.agenda ? (
                      <p className="text-muted-foreground mt-2 text-sm">{meeting.agenda}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </AsyncBoundary>
        </TabsContent>
      </Tabs>

      <EventDialog open={creatingEvent} onOpenChange={setCreatingEvent} />
      <MeetingDialog open={creatingMeeting} onOpenChange={setCreatingMeeting} />
    </div>
  );
}

function EventStateBadge({ state }: { state: string }) {
  return <StatusBadge status={state} />;
}

function EventDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [kind, setKind] = useState<PublicEventKind>("EVENT");
  const [externalUrl, setExternalUrl] = useState("");
  const [sigId, setSigId] = useState("none");
  const [formError, setFormError] = useState<string | null>(null);

  const sigs = useQuery({ queryKey: queryKeys.sigs.list(), queryFn: ({ signal }) => listSigs(undefined, signal), enabled: open });

  const create = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const values = parseForm(
        eventSchema,
        { title, capacity, starts_at: start, ends_at: end },
        (_field, message) => setFormError(message),
      );
      if (!values) return null;
      const startsAt = localInputToIso(values.starts_at);
      const endsAt = localInputToIso(values.ends_at);
      if (!startsAt || !endsAt || startsAt >= endsAt) {
        setFormError("The end time must be after the start time.");
        return null;
      }
      return createEvent({
        title: values.title,
        description: description.trim() || undefined,
        capacity: values.capacity,
        starts_at: startsAt,
        ends_at: endsAt,
        location: location.trim() || undefined,
        external_url: externalUrl.trim() || undefined,
        kind,
        sig_id: sigId === "none" ? null : Number(sigId),
      });
    },
    onSuccess: (event) => {
      if (!event) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.all });
      toast.success("Event created as a draft — publish it from its page.");
      onOpenChange(false);
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : "Could not create the event."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New event</DialogTitle>
          <DialogDescription>Drafts are visible only to managers until published.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          noValidate
        >
          <Field label="Title" htmlFor="ev-title" error={formError ?? undefined}>
            <Input id="ev-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Description" htmlFor="ev-description">
            <Textarea id="ev-description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Starts" htmlFor="ev-start">
              <Input id="ev-start" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} />
            </Field>
            <Field label="Ends" htmlFor="ev-end">
              <Input id="ev-end" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" htmlFor="ev-kind">
              <NativeSelect
                id="ev-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as PublicEventKind)}
              >
                <option value="EVENT">Event</option>
                <option value="HACKATHON">Hackathon</option>
                <option value="CTF">CTF</option>
              </NativeSelect>
            </Field>
            <Field label="Registration URL" htmlFor="ev-url">
              <Input
                id="ev-url"
                type="url"
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location" htmlFor="ev-location">
              <Input id="ev-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lab 3" />
            </Field>
            <Field label="Capacity" htmlFor="ev-capacity">
              <Input id="ev-capacity" type="number" min={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
            </Field>
          </div>
          <Field label="SIG (optional)" htmlFor="ev-sig">
            <NativeSelect id="ev-sig" value={sigId} onChange={(event) => setSigId(event.target.value)}>
              <option value="none">Global</option>
              {(sigs.data ?? []).map((sig) => (
                <option key={sig.id} value={String(sig.id)}>
                  {sig.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Create event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const meetingSchema = z.object({
  title: z.string().min(1, "Enter a title."),
  agenda: z.string().min(1, "Write an agenda."),
  starts_at: z.string().min(1, "Pick a start time."),
  ends_at: z.string().min(1, "Pick an end time."),
});

function MeetingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agenda, setAgenda] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [sigId, setSigId] = useState("none");
  const [formError, setFormError] = useState<string | null>(null);
  const sigs = useQuery({ queryKey: queryKeys.sigs.list(), queryFn: ({ signal }) => listSigs(undefined, signal), enabled: open });

  const create = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const values = parseForm(
        meetingSchema,
        { title, agenda, starts_at: start, ends_at: end },
        (_field, message) => setFormError(message),
      );
      if (!values) return null;
      const startsAt = localInputToIso(values.starts_at);
      const endsAt = localInputToIso(values.ends_at);
      if (!startsAt || !endsAt || startsAt >= endsAt) {
        setFormError("The end time must be after the start time.");
        return null;
      }
      return createMeeting({
        title: values.title,
        agenda: values.agenda,
        starts_at: startsAt,
        ends_at: endsAt,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        sig_id: sigId === "none" ? null : Number(sigId),
      });
    },
    onSuccess: (meeting) => {
      if (!meeting) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.all });
      toast.success("Meeting created as a draft.");
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setAgenda("");
      setStart("");
      setEnd("");
      setLocation("");
      setSigId("none");
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : "Could not create the meeting."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New meeting</DialogTitle>
          <DialogDescription>Meetings start as drafts until published.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          noValidate
        >
          <Field label="Title" htmlFor="meeting-title" error={formError ?? undefined}>
            <Input id="meeting-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Agenda" htmlFor="meeting-agenda">
            <Textarea id="meeting-agenda" rows={4} value={agenda} onChange={(event) => setAgenda(event.target.value)} />
          </Field>
          <Field label="Description" htmlFor="meeting-description">
            <Textarea id="meeting-description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Starts" htmlFor="meeting-start">
              <Input id="meeting-start" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} />
            </Field>
            <Field label="Ends" htmlFor="meeting-end">
              <Input id="meeting-end" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location" htmlFor="meeting-location">
              <Input id="meeting-location" value={location} onChange={(event) => setLocation(event.target.value)} />
            </Field>
            <Field label="SIG (optional)" htmlFor="meeting-sig">
              <NativeSelect id="meeting-sig" value={sigId} onChange={(event) => setSigId(event.target.value)}>
                <option value="none">Global</option>
                {(sigs.data ?? []).map((sig) => (
                  <option key={sig.id} value={String(sig.id)}>{sig.name}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>Create meeting</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
