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

export interface PageMetadata {
  total: number;
  limit: number;
  offset: number;
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

function buildQuery(params: { limit?: number; offset?: number; includeDrafts?: boolean }) {
  const search = new URLSearchParams({
    limit: String(params.limit ?? 50),
    offset: String(params.offset ?? 0),
  });
  if (params.includeDrafts) search.set("include_drafts", "true");
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function listEvents(params: { limit?: number; offset?: number; includeDrafts?: boolean } = {}, signal?: AbortSignal) {
  return apiRequest<{ events: ClubEvent[] } & PageMetadata>(
    `/operations/events${buildQuery(params)}`,
    { signal },
  );
}

export async function getEvent(eventId: number, signal?: AbortSignal) {
  const { event } = await apiRequest<{ event: ClubEvent }>(`/operations/events/${eventId}`, { signal });
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

export async function getCalendarRange(
  start: string,
  end: string,
  params: { limit?: number; offset?: number } | AbortSignal = {},
  signal?: AbortSignal,
) {
  const page = "aborted" in params ? {} : params;
  const requestSignal = "aborted" in params ? params : signal;
  const search = new URLSearchParams({ start, end, limit: String(page.limit ?? 100), offset: String(page.offset ?? 0) });
  return apiRequest<{ calendar: ClubEvent[] } & PageMetadata>(
    `/operations/calendar?${search}`,
    { signal: requestSignal },
  );
}

export async function listMeetings(params: { limit?: number; offset?: number; includeDrafts?: boolean } = {}, signal?: AbortSignal) {
  return apiRequest<{ meetings: Meeting[] } & PageMetadata>(
    `/operations/meetings${buildQuery(params)}`,
    { signal },
  );
}

export async function getMeeting(meetingId: number, signal?: AbortSignal) {
  const { meeting } = await apiRequest<{ meeting: Meeting }>(`/operations/meetings/${meetingId}`, { signal });
  return meeting;
}

export async function publishMeeting(meetingId: number) {
  const { meeting } = await apiRequest<{ meeting: Meeting }>(`/operations/meetings/${meetingId}/publish`, { method: "POST" });
  return meeting;
}

export async function cancelMeeting(meetingId: number) {
  const { meeting } = await apiRequest<{ meeting: Meeting }>(`/operations/meetings/${meetingId}/cancel`, { method: "POST" });
  return meeting;
}

export async function updateMinutes(meetingId: number, minutesDocumentId: number | null) {
  const { meeting } = await apiRequest<{ meeting: Meeting }>(`/operations/meetings/${meetingId}/minutes`, {
    method: "PATCH",
    body: { minutes_document_id: minutesDocumentId },
  });
  return meeting;
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

export async function listAttendance(
  eventId: number,
  params: number | { limit?: number; offset?: number } = {},
  signal?: AbortSignal,
) {
  const page = typeof params === "number" ? { limit: params, offset: 0 } : params;
  const search = new URLSearchParams({ limit: String(page.limit ?? 100), offset: String(page.offset ?? 0) });
  return apiRequest<AttendanceSummary & PageMetadata>(
    `/operations/events/${eventId}/attendance?${search}`,
    { signal },
  );
}

export async function getMyAttendance(eventId: number, signal?: AbortSignal) {
  const { attendance } = await apiRequest<{
    attendance: { event_id: number; present: boolean; attendance: AttendanceRecord | null };
  }>(`/operations/events/${eventId}/attendance/me`, { signal });
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
