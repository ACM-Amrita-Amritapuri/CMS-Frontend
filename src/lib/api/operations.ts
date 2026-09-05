import { apiRequest } from "@/lib/api/client";

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

export async function listAnnouncements(params: {
  limit?: number;
  includeDrafts?: boolean;
} = {}) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.includeDrafts) search.set("include_drafts", "true");
  const { announcements } = await apiRequest<{ announcements: Announcement[] }>(
    `/operations/announcements?${search}`,
  );
  return announcements;
}

export async function listEvents(params: {
  limit?: number;
  includeDrafts?: boolean;
} = {}) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.includeDrafts) search.set("include_drafts", "true");
  const { events } = await apiRequest<{ events: ClubEvent[] }>(
    `/operations/events?${search}`,
  );
  return events;
}

export async function getEvent(eventId: number) {
  const { event } = await apiRequest<{ event: ClubEvent }>(
    `/operations/events/${eventId}`,
  );
  return event;
}

export async function listMeetings(params: {
  limit?: number;
  includeDrafts?: boolean;
} = {}) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.includeDrafts) search.set("include_drafts", "true");
  const { meetings } = await apiRequest<{ meetings: Meeting[] }>(
    `/operations/meetings?${search}`,
  );
  return meetings;
}

export async function getCalendar(start: string, end: string, limit = 100) {
  const search = new URLSearchParams({ start, end, limit: String(limit) });
  const { calendar } = await apiRequest<{ calendar: ClubEvent[] }>(
    `/operations/calendar?${search}`,
  );
  return calendar;
}
