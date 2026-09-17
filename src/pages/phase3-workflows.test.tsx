import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EventDetailPage, { resolveAttendanceIdentity } from "@/pages/operations/EventDetailPage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import { AssignmentPanel } from "@/components/learning/assignment-panel";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { LearningAssignment, LearningSubmission } from "@/lib/api/learning";
import type { ClubEvent } from "@/lib/api/club-operations";

const session = vi.hoisted(() => ({ manage: true, id: 1 }));
vi.mock("@/app/providers", () => ({ useSession: () => ({ user: { id: session.id }, hasCapability: () => session.manage }) }));
vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));
const request = vi.mocked(apiRequest);
let client: QueryClient;

beforeEach(() => {
  session.manage = true;
  session.id = 1;
  request.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
});
afterEach(() => { cleanup(); client.clear(); });

function mount(element: React.ReactNode, path = "/", route = "/") {
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path={route} element={element} /></Routes></MemoryRouter></QueryClientProvider>);
}

const assignment: LearningAssignment = { id: 5, title: "Write a parser", instructions: "Explain your solution", assignment_type: "TEXT", position: 1, deadline_at: null, publication_state: "PUBLISHED" };
const submission: LearningSubmission = { id: 41, assignment_id: 5, member_user_id: 1, submission_state: "DRAFT", content: "Saved solution", external_url: null, feedback: null, score: null, submitted_at: null, reviewed_at: null };
const event: ClubEvent = { id: 7, title: "Planning", description: null, sig_id: null, owner_user_id: 1, starts_at: "2026-09-01T12:00:00Z", ends_at: "2026-09-01T13:00:00Z", location: null, external_url: null, capacity: 20, kind: "MEETING", state: "DRAFT", published_at: null, cancelled_at: null };

function meetingApi(state: ClubEvent["state"]) {
  const meeting = { id: 12, event: { ...event, state }, agenda: "Discuss next steps", project_id: null, minutes_document_id: null };
  request.mockImplementation(async (path) => {
    if (path === "/operations/events/7") return { event: meeting.event };
    if (path === "/operations/meetings/12") return { meeting };
    if (path.endsWith("/publish")) return { meeting: { ...meeting, event: { ...meeting.event, state: "PUBLISHED" } } };
    if (path.endsWith("/cancel")) return { meeting: { ...meeting, event: { ...meeting.event, state: "CANCELLED" } } };
    if (path.endsWith("/minutes")) return { meeting: { ...meeting, minutes_document_id: 9 } };
    if (path.includes("/attendance/me")) return { attendance: { present: false } };
    if (path.includes("/attendance")) return { attendance: [], present_count: 0, capacity: 20 };
    throw new Error(`Unexpected request: ${path}`);
  });
}

describe("attendance identity", () => {
  it.each([
    ["user", " 123 ", { user_id: 123 }],
    ["username", " 00123 ", { username: "00123" }],
    ["roll", " 00123 ", { roll_number: "00123" }],
    ["username", "22BCE1234", { username: "22BCE1234" }],
    ["roll", "alice", { roll_number: "alice" }],
  ] as const)("resolves %s without reinterpretation", (type, value, expected) => {
    expect(resolveAttendanceIdentity(type, value)).toEqual(expected);
  });
  it.each(["", "0", "-1", "1.5", "1e2", "alice", "9007199254740992"])("rejects invalid user ID %s", (value) => {
    expect(() => resolveAttendanceIdentity("user", value)).toThrow();
  });
  it("sends exactly the selected identity and never retries as another type", async () => {
    meetingApi("PUBLISHED");
    const original = request.getMockImplementation()!;
    request.mockImplementation(async (path, options) => {
      if (options?.method === "POST") throw new Error("Unknown username");
      return original(path, options);
    });
    mount(<EventDetailPage />, "/operations/events/7?meetingId=12", "/operations/events/:eventId");
    fireEvent.click(await screen.findByLabelText("Username"));
    fireEvent.change(screen.getByLabelText("Member identifier"), { target: { value: "00123" } });
    fireEvent.click(screen.getByRole("button", { name: "Mark present" }));
    await screen.findByText("Unknown username");
    expect(request.mock.calls.filter(([, options]) => options?.method === "POST")).toEqual([
      ["/operations/events/7/attendance", { method: "POST", body: { username: "00123" } }],
    ]);
    fireEvent.click(screen.getByLabelText("User ID"));
    fireEvent.change(screen.getByLabelText("Member identifier"), { target: { value: "1e2" } });
    fireEvent.click(screen.getByRole("button", { name: "Mark present" }));
    await screen.findByText("Enter a positive integer user ID.");
    expect(request.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(1);
  });
});

describe("meeting lifecycle", () => {
  it.each([
    ["DRAFT", true, true, true, true],
    ["PUBLISHED", true, false, true, true],
    ["CANCELLED", true, false, false, false],
    ["PUBLISHED", false, false, false, false],
  ] as const)("gates %s manager=%s", async (state, manage, publish, cancel, minutes) => {
    session.manage = manage;
    meetingApi(state);
    mount(<EventDetailPage />, "/operations/events/7?meetingId=12", "/operations/events/:eventId");
    await screen.findByText("Discuss next steps");
    expect(Boolean(screen.queryByRole("button", { name: "Publish meeting" }))).toBe(publish);
    expect(Boolean(screen.queryByRole("button", { name: "Cancel meeting" }))).toBe(cancel);
    expect(Boolean(screen.queryByRole("button", { name: "Attach minutes" }))).toBe(minutes);
  });
  it("renders plain events without a meetingId query param", async () => {
    request.mockImplementation(async (path) => {
      if (path === "/operations/events/7") return { event: { ...event, kind: "EVENT", state: "PUBLISHED" } };
      if (path.includes("/attendance/me")) return { attendance: { present: false } };
      throw new Error(`Unexpected request: ${path}`);
    });
    mount(<EventDetailPage />, "/operations/events/7", "/operations/events/:eventId");
    await screen.findByText("Planning");
    expect(request.mock.calls.every(([path]) => !path.startsWith("/operations/meetings"))).toBe(true);
  });
  it("uses the meeting ID for publish and minutes, not the event ID", async () => {
    meetingApi("DRAFT");
    mount(<EventDetailPage />, "/operations/events/7?meetingId=12", "/operations/events/:eventId");
    fireEvent.click(await screen.findByRole("button", { name: "Publish meeting" }));
    await waitFor(() => expect(request).toHaveBeenCalledWith("/operations/meetings/12/publish", { method: "POST" }));
    fireEvent.change(screen.getByLabelText("Minutes document ID"), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: "Attach minutes" }));
    await waitFor(() => expect(request).toHaveBeenCalledWith("/operations/meetings/12/minutes", { method: "PATCH", body: { minutes_document_id: 9 } }));
  });
});

describe("assignment workflow", () => {
  it("restores reviewed content, feedback and score without overwriting edits on refetch", async () => {
    request.mockResolvedValue({ submission: { ...submission, submission_state: "REVIEWED", feedback: "Well done", score: 0 } });
    mount(<AssignmentPanel assignment={assignment} />);
    const editor = await screen.findByLabelText("Submission text");
    expect(editor).toHaveValue("Saved solution");
    expect(screen.getByText("Well done")).toBeInTheDocument();
    expect(screen.getByText("0/100")).toBeInTheDocument();
    fireEvent.change(editor, { target: { value: "Unsaved edit" } });
    await client.refetchQueries({ queryKey: queryKeys.learning.mySubmission(5, 1) });
    expect(editor).toHaveValue("Unsaved edit");
  });
  it("restores link drafts and updates the submission cache after save", async () => {
    request.mockImplementation(async (_path, options) => ({ submission: { ...submission, external_url: options?.method === "POST" ? "https://github.com/acm/new" : "https://github.com/acm/saved" } }));
    mount(<AssignmentPanel assignment={{ ...assignment, assignment_type: "LINK" }} />);
    const editor = await screen.findByLabelText("Submission link");
    expect(editor).toHaveValue("https://github.com/acm/saved");
    fireEvent.change(editor, { target: { value: "https://github.com/acm/new" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(client.getQueryData<LearningSubmission>(queryKeys.learning.mySubmission(5, 1))?.external_url).toBe("https://github.com/acm/new"));
    expect(editor).toHaveValue("https://github.com/acm/new");
  });
  it("loads the reviewer queue independently of my submission and saves a review", async () => {
    const queued = { ...submission, id: 42, member_user_id: 2, submission_state: "SUBMITTED", content: "Another member's answer" };
    request.mockImplementation(async (path) => {
      if (path.endsWith("/submission")) return { submission: null };
      if (path.endsWith("/review")) return { submission: { ...queued, submission_state: "REVIEWED", score: 90 } };
      return { submissions: [queued] };
    });
    mount(<AssignmentPanel assignment={assignment} />);
    expect(request.mock.calls.some(([path]) => path.endsWith("/submissions"))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Load review queue" }));
    await screen.findByText("Another member's answer");
    fireEvent.change(screen.getByLabelText("Score (0–100)"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: "Save review" }));
    await screen.findByText("REVIEWED");
    expect(client.getQueryData<LearningSubmission[]>(queryKeys.learning.submissions(5))?.[0].score).toBe(90);
  });
  it("does not fetch the reviewer queue for members", async () => {
    session.manage = false;
    request.mockResolvedValue({ submission: null });
    mount(<AssignmentPanel assignment={assignment} />);
    await screen.findByLabelText("Submission text");
    expect(screen.queryByRole("button", { name: "Load review queue" })).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
  });
});

it("loads project work from the server and updates caches after create and state changes", async () => {
  const project = { id: 3, title: "Club site", summary: "Build it", description: "Overview", lead_user_id: 1, progress: 0, team_capacity: 3, state: "PUBLISHED", roles: [], team_memberships: [], applications: [] };
  const task = { id: 11, project_id: 3, title: "Existing task", state: "TODO" };
  const milestone = { id: 21, project_id: 3, title: "First release", state: "PLANNED" };
  request.mockImplementation(async (path, options) => {
    if (path === "/projects/3") return { project };
    if (path === "/projects/3/tasks") return options?.method === "POST" ? { task: { ...task, id: 12, title: "New task" } } : { tasks: [task] };
    if (path === "/projects/3/milestones") return options?.method === "POST" ? { milestone: { ...milestone, id: 22, title: "Second release" } } : { milestones: [milestone] };
    if (path === "/projects/tasks/11") return { task: { ...task, state: "DONE" } };
    if (path === "/projects/milestones/21") return { milestone: { ...milestone, state: "DONE" } };
    throw new Error(`Unexpected request: ${path}`);
  });
  mount(<ProjectDetailPage />, "/projects/3", "/projects/:projectId");
  const tab = await screen.findByRole("tab", { name: "Work" });
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  const existing = await screen.findByText("Existing task");
  const release = await screen.findByText("First release");
  fireEvent.click(within(existing.closest("li")!).getByRole("button", { name: "done" }));
  await waitFor(() => expect(client.getQueryData<{ state: string }[]>(queryKeys.projects.tasks(3))?.[0].state).toBe("DONE"));
  fireEvent.click(within(release.closest("li")!).getByRole("button", { name: "done" }));
  await waitFor(() => expect(client.getQueryData<{ state: string }[]>(queryKeys.projects.milestones(3))?.[0].state).toBe("DONE"));
  fireEvent.click(screen.getByRole("button", { name: "New task" }));
  fireEvent.change(screen.getByPlaceholderText("Task title"), { target: { value: "New task" } });
  fireEvent.submit(screen.getByPlaceholderText("Task title").closest("form")!);
  await waitFor(() => expect(client.getQueryData<unknown[]>(queryKeys.projects.tasks(3))).toHaveLength(2));
  const section = release.closest("section")!;
  fireEvent.click(within(section).getByRole("button", { name: "Add" }));
  fireEvent.change(screen.getByPlaceholderText("Milestone title"), { target: { value: "Second release" } });
  fireEvent.submit(screen.getByPlaceholderText("Milestone title").closest("form")!);
  await waitFor(() => expect(client.getQueryData<unknown[]>(queryKeys.projects.milestones(3))).toHaveLength(2));
  expect(screen.getByText("Second release")).toBeInTheDocument();
});
