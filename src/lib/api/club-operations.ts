import { apiRequest } from "@/lib/api/client";
export interface ClubEvent {
  id: number;
  title: string;
  description: string;
  sig_id: number | null;
  owner_user_id: number;
  starts_at: string;
  ends_at: string;
  location: string;
  external_url: string | null;
  capacity: number;
  kind: "EVENT" | "MEETING" | "HACKATHON" | "CTF";
  state: "DRAFT" | "PUBLISHED" | "CANCELLED";
  published_at: string | null;
  cancelled_at: string | null;
}

export interface Meeting {
  id: number;
  event: ClubEvent;
  project_id: number | null;
  agenda: string;
  minutes_document_id: number | null;
}

type EventInput = {
  title: string;
  description?: string;
  sig_id?: number | null;
  starts_at: string;
  ends_at: string;
  location?: string;
  external_url?: string | null;
  capacity: number;
};

function buildQuery(params: { limit?: number; includeDrafts?: boolean }) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.includeDrafts) search.set("include_drafts", "true");
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function listEvents(params: { limit?: number; includeDrafts?: boolean } = {}) {
  const { events } = await apiRequest<{ events: ClubEvent[] }>(
    `/operations/events${buildQuery(params)}`,
  );
  return events;
}

export async function getEvent(eventId: number) {
  const { event } = await apiRequest<{ event: ClubEvent }>(`/operations/events/${eventId}`);
  return event;
}

export async function createEvent(input: EventInput) {
  const { event } = await apiRequest<{ event: ClubEvent }>("/operations/events", {
    method: "POST",
    body: input,
  });
  return event;
}

export async function publishEvent(eventId: number) {
  const { event } = await apiRequest<{ event: ClubEvent }>(
    `/operations/events/${eventId}/publish`,
    { method: "POST" },
  );
  return event;
}

export async function cancelEvent(eventId: number) {
  const { event } = await apiRequest<{ event: ClubEvent }>(
    `/operations/events/${eventId}/cancel`,
    { method: "POST" },
  );
  return event;
}

export async function getCalendarRange(start: string, end: string) {
  const search = new URLSearchParams({ start, end, limit: "100" });
  const { calendar } = await apiRequest<{ calendar: ClubEvent[] }>(
    `/operations/calendar?${search}`,
  );
  return calendar;
}

export async function listMeetings(params: { limit?: number; includeDrafts?: boolean } = {}) {
  const { meetings } = await apiRequest<{ meetings: Meeting[] }>(
    `/operations/meetings${buildQuery(params)}`,
  );
  return meetings;
}

export async function createMeeting(input: {
  title: string;
  description?: string;
  sig_id?: number | null;
  starts_at: string;
  ends_at: string;
  agenda: string;
  location?: string;
}) {
  const { meeting } = await apiRequest<{ meeting: Meeting }>("/operations/meetings", {
    method: "POST",
    body: input,
  });
  return meeting;
}
