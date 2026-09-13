import { apiRequest } from "@/lib/api/client";

export type PublicEventKind = "EVENT" | "HACKATHON" | "CTF";

export interface ClubEvent {
  id: number;
  title: string;
  description: string | null;
  sig_id: number | null;
  owner_user_id: number;
  starts_at: string;
  ends_at: string;
  location: string | null;
  external_url: string | null;
  capacity: number;
  kind: PublicEventKind | "MEETING";
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
  kind?: PublicEventKind;
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

export interface AttendanceRecord {
  id: number;
  operation_id: number;
  user_id: number;
  username: string | null;
  roll_number: string | null;
  status: string;
  marked_by_user_id: number | null;
  marked_at: string | null;
  created_at: string | null;
}

export interface AttendanceSummary {
  event_id: number;
  capacity: number | null;
  present_count: number;
  attendance: AttendanceRecord[];
}

export async function listAttendance(eventId: number, limit = 100) {
  return apiRequest<AttendanceSummary>(
    `/operations/events/${eventId}/attendance?limit=${limit}`,
  );
}

export async function getMyAttendance(eventId: number) {
  const { attendance } = await apiRequest<{
    attendance: { event_id: number; present: boolean; attendance: AttendanceRecord | null };
  }>(`/operations/events/${eventId}/attendance/me`);
  return attendance;
}

export async function markAttendance(
  eventId: number,
  input: { user_id?: number; roll_number?: string; username?: string },
) {
  const { attendance } = await apiRequest<{ attendance: AttendanceRecord }>(
    `/operations/events/${eventId}/attendance`,
    { method: "POST", body: input },
  );
  return attendance;
}

export async function removeAttendance(eventId: number, userId: number) {
  return apiRequest<{ event_id: number; user_id: number; present: boolean }>(
    `/operations/events/${eventId}/attendance/${userId}`,
    { method: "DELETE" },
  );
}
