"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  MegaphoneIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";
import { z } from "zod";

import {
  createAnnouncement,
  createEvent,
  createMeeting,
  listAnnouncements,
  listEvents,
  listMeetings,
  publishAnnouncement,
} from "@/lib/api/club-operations";
import { listSigs } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";
import { localInputToIso } from "@/lib/formatters/date";
import { parseForm } from "@/lib/form-validation";
import { useSession } from "@/app/providers";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
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

const announcementSchema = z.object({
  title: z.string().min(1, "Enter a title."),
  body: z.string().min(1, "Write the announcement."),
});

export default function OperationsPage() {
  const { hasCapability } = useSession();
  const manage = hasCapability("manage_operations");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ["operations", "events", manage],
    queryFn: () => listEvents({ includeDrafts: manage }),
  });
  const announcementsQuery = useQuery({
    queryKey: ["operations", "announcements", manage],
    queryFn: () => listAnnouncements({ includeDrafts: manage }),
  });
  const meetingsQuery = useQuery({
    queryKey: ["operations", "meetings", manage],
    queryFn: () => listMeetings({ includeDrafts: manage }),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Plan events, announcements, and meetings for the club.
          </p>
        </div>
        {manage ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreatingAnnouncement(true)}>
              <MegaphoneIcon /> New announcement
            </Button>
            <Button onClick={() => setCreatingEvent(true)}>
              <PlusIcon /> New event
            </Button>
            <Button variant="outline" onClick={() => setCreatingMeeting(true)}>
              <CalendarDaysIcon /> New meeting
            </Button>
          </div>
        ) : null}
      </header>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <AsyncBoundary
            query={eventsQuery}
            isEmpty={(events) => events.length === 0}
            empty={{ icon: CalendarDaysIcon, title: "No events yet" }}
          >
            {(events) => (
              <ul className="grid gap-3 sm:grid-cols-2">
                {events.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/operations/events/${event.id}`}
                      className="bg-card hover:border-primary/50 hover:shadow-md flex h-full flex-col gap-2 rounded-xl border p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-sm font-semibold">{event.title}</h2>
                        <EventStateBadge state={event.state} />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(event.starts_at)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                      <div className="mt-auto flex items-center gap-2 text-xs">
                        <Badge variant="outline">
                          <UsersIcon className="size-3" /> {event.capacity} capacity
                        </Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AsyncBoundary>
        </TabsContent>

        <TabsContent value="announcements">
          <AsyncBoundary
            query={announcementsQuery}
            isEmpty={(items) => items.length === 0}
            empty={{ icon: MegaphoneIcon, title: "No announcements yet" }}
          >
            {(items) => (
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item.id} className="bg-card rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-sm font-semibold">{item.title}</h2>
                      <Badge
                        variant={
                          item.state === "PUBLISHED"
                            ? "success"
                            : item.state === "DRAFT"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {item.state.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">{item.body}</p>
                    {item.state === "DRAFT" && manage ? (
                      <PublishButton
                        label="announcement"
                        onPublish={() => publishAnnouncement(item.id)}
                      />
                    ) : null}
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
              <ul className="flex flex-col gap-3">
                {meetings.map((meeting) => (
                  <li key={meeting.id} className="bg-card rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-2">
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
      <AnnouncementDialog open={creatingAnnouncement} onOpenChange={setCreatingAnnouncement} />
      <MeetingDialog open={creatingMeeting} onOpenChange={setCreatingMeeting} />
    </div>
  );
}

function EventStateBadge({ state }: { state: string }) {
  const variant =
    state === "PUBLISHED" ? "success" : state === "CANCELLED" ? "destructive" : "warning";
  return <Badge variant={variant}>{state.toLowerCase()}</Badge>;
}

function PublishButton({
  label,
  onPublish,
}: {
  label: string;
  onPublish: () => Promise<unknown>;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-3"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await onPublish();
          toast.success(`${label} published.`);
        } catch (error) {
          toast.error(error instanceof ApiError ? error.message : "Could not publish.");
        } finally {
          setPending(false);
        }
      }}
    >
      <CheckCircle2Icon /> Publish {label}
    </Button>
  );
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
  const [sigId, setSigId] = useState("none");
  const [formError, setFormError] = useState<string | null>(null);

  const sigs = useQuery({ queryKey: ["sigs"], queryFn: () => listSigs(), enabled: open });

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
        sig_id: sigId === "none" ? null : Number(sigId),
      });
    },
    onSuccess: (event) => {
      if (!event) return;
      queryClient.invalidateQueries({ queryKey: ["operations"] });
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
            <Field label="Location" htmlFor="ev-location">
              <Input id="ev-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lab 3" />
            </Field>
            <Field label="Capacity" htmlFor="ev-capacity">
              <Input id="ev-capacity" type="number" min={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
            </Field>
          </div>
          <Field label="SIG (optional)" htmlFor="ev-sig">
            <select id="ev-sig" value={sigId} onChange={(event) => setSigId(event.target.value)} className="border-input h-9 w-full rounded-lg border bg-transparent px-3 text-sm">
              <option value="none">Global</option>
              {(sigs.data ?? []).map((sig) => (
                <option key={sig.id} value={String(sig.id)}>
                  {sig.name}
                </option>
              ))}
            </select>
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

function AnnouncementDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const values = parseForm(announcementSchema, { title, body }, (_field, message) =>
        setFormError(message),
      );
      if (!values) return null;
      return createAnnouncement(values);
    },
    onSuccess: (announcement) => {
      if (!announcement) return;
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      toast.success("Announcement saved as a draft.");
      onOpenChange(false);
      setTitle("");
      setBody("");
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : "Could not create the announcement."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>Publish it to make it visible to all members.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          noValidate
        >
          <Field label="Title" htmlFor="ann-title" error={formError ?? undefined}>
            <Input id="ann-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Body" htmlFor="ann-body">
            <Textarea id="ann-body" rows={4} value={body} onChange={(event) => setBody(event.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Save draft
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
  const sigs = useQuery({ queryKey: ["sigs"], queryFn: () => listSigs(), enabled: open });

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
      queryClient.invalidateQueries({ queryKey: ["operations"] });
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
              <select id="meeting-sig" value={sigId} onChange={(event) => setSigId(event.target.value)} className="border-input h-9 w-full rounded-lg border bg-transparent px-3 text-sm">
                <option value="none">Global</option>
                {(sigs.data ?? []).map((sig) => (
                  <option key={sig.id} value={String(sig.id)}>{sig.name}</option>
                ))}
              </select>
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
