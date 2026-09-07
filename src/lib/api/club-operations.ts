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
  registered_count: number;
  kind: "EVENT" | "MEETING";
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

export interface Announcement {
  id: number;
  title: string;
  body: string;
  sig_id: number | null;
  author_user_id: number;
  state: "DRAFT" | "PUBLISHED" | "EXPIRED";
  expires_at: string | null;
  published_at: string | null;
}



export interface Registration {
  id: number;
  event_id: number;
  member_user_id: number;
  state: "REGISTERED" | "CANCELLED";
  registered_at: string;
  cancelled_at: string | null;
}

export interface AttendanceRecord {
  id: number;
  event_id: number;
  member_user_id: number;
  recorded_by_user_id: number;
  method: "MANUAL" | "QR";
  attended_at: string;
}

export interface RecruitmentCycle {
  id: number;
  title: string;
  description: string;
  sig_id: number | null;
  owner_user_id: number;
  opens_at: string;
  closes_at: string;
  state: "DRAFT" | "OPEN" | "CLOSED";
}

export interface RecruitmentApplication {
  id: number;
  cycle_id: number;
  applicant_user_id: number;
  preferred_sig_id: number | null;
  statement: string;
  state:
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "INTERVIEW"
    | "SELECTED"
    | "REJECTED"
    | "WITHDRAWN";
  reviewer_user_id: number | null;
  evaluation_score: number | null;
  evaluation_notes: string | null;
  interview_at: string | null;
  interview_notes: string | null;
  reviewed_at: string | null;
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

export async function listAnnouncements(params: {
  limit?: number;
  includeDrafts?: boolean;
} = {}) {
  const { announcements } = await apiRequest<{ announcements: Announcement[] }>(
    `/operations/announcements${buildQuery(params)}`,
  );
  return announcements;
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  sig_id?: number | null;
  expires_at?: string | null;
}) {
  const { announcement } = await apiRequest<{ announcement: Announcement }>(
    "/operations/announcements",
    { method: "POST", body: input },
  );
  return announcement;
}

export async function publishAnnouncement(announcementId: number) {
  const { announcement } = await apiRequest<{ announcement: Announcement }>(
    `/operations/announcements/${announcementId}/publish`,
    { method: "POST" },
  );
  return announcement;
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

export async function registerForEvent(eventId: number) {
  const { registration } = await apiRequest<{ registration: Registration }>(
    `/operations/events/${eventId}/registrations`,
    { method: "POST" },
  );
  return registration;
}

export async function cancelRegistration(registrationId: number) {
  const { registration } = await apiRequest<{ registration: Registration }>(
    `/operations/registrations/${registrationId}`,
    { method: "DELETE" },
  );
  return registration;
}

export async function recordAttendance(
  eventId: number,
  input: { member_user_id: number; method: "MANUAL" | "QR" },
) {
  const { attendance } = await apiRequest<{ attendance: AttendanceRecord }>(
    `/operations/events/${eventId}/attendance`,
    { method: "POST", body: input },
  );
  return attendance;
}

export async function listAttendance(eventId: number) {
  const { attendance } = await apiRequest<{ attendance: AttendanceRecord[] }>(
    `/operations/events/${eventId}/attendance`,
  );
  return attendance;
}

export async function submitEventFeedback(
  eventId: number,
  input: { rating: number; comment?: string },
) {
  const { feedback } = await apiRequest<{ feedback: { id: number; rating: number } }>(
    `/operations/events/${eventId}/feedback`,
    { method: "POST", body: input },
  );
  return feedback;
}

export async function getCalendarRange(start: string, end: string) {
  const search = new URLSearchParams({ start, end, limit: "100" });
  const { calendar } = await apiRequest<{ calendar: ClubEvent[] }>(
    `/operations/calendar?${search}`,
  );
  return calendar;
}

export async function listCycles() {
  const { cycles } = await apiRequest<{ cycles: RecruitmentCycle[] }>(
    `/operations/recruitment/cycles?limit=100`,
  );
  return cycles;
}

export async function createCycle(input: {
  title: string;
  description?: string;
  sig_id?: number | null;
  opens_at: string;
  closes_at: string;
}) {
  const { cycle } = await apiRequest<{ cycle: RecruitmentCycle }>(
    "/operations/recruitment/cycles",
    { method: "POST", body: input },
  );
  return cycle;
}

export async function transitionCycle(
  cycleId: number,
  action: "open" | "close",
) {
  const { cycle } = await apiRequest<{ cycle: RecruitmentCycle }>(
    `/operations/recruitment/cycles/${cycleId}/${action}`,
    { method: "POST" },
  );
  return cycle;
}

export async function applyToCycle(
  cycleId: number,
  input: { statement: string; preferred_sig_id?: number | null },
) {
  const { application } = await apiRequest<{ application: RecruitmentApplication }>(
    `/operations/recruitment/cycles/${cycleId}/applications`,
    { method: "POST", body: input },
  );
  return application;
}

export async function listCycleApplications(cycleId: number) {
  const { applications } = await apiRequest<{ applications: RecruitmentApplication[] }>(
    `/operations/recruitment/cycles/${cycleId}/applications`,
  );
  return applications;
}

export async function updateRecruitmentApplication(
  applicationId: number,
  input:
    | { reviewer_user_id: number }
    | { decision: "REVIEW" | "INTERVIEW" | "SELECT" | "REJECT" | "WITHDRAW" }
    | {
        evaluation_score?: number | null;
        evaluation_notes?: string;
        interview_at?: string | null;
        interview_notes?: string;
      },
) {
  const { application } = await apiRequest<{ application: RecruitmentApplication }>(
    `/operations/recruitment/applications/${applicationId}`,
    { method: "PATCH", body: input },
  );
  return application;
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
