import { apiRequest } from "@/lib/api/client";

export interface ProjectRole {
  id: number;
  title: string;
  description: string;
  capacity: number;
  required_skills: string[];
}

export interface ProjectApplication {
  id: number;
  project_id: number;
  role_id: number;
  applicant_user_id: number;
  note: string | null;
  state: "PENDING" | "ACCEPTED" | "REJECTED";
  reviewed_by_user_id: number | null;
}

export interface ProjectMembership {
  id: number;
  project_id: number;
  role_id: number | null;
  member_user_id: number;
  accepted_by_user_id: number | null;
  left_at: string | null;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  created_by_user_id: number;
  assignee_user_id: number | null;
  title: string;
  description: string | null;
  state: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  due_at: string | null;
  blocker: string | null;
  weekly_update: string | null;
}

export interface ProjectMilestone {
  id: number;
  project_id: number;
  created_by_user_id: number;
  title: string;
  description: string | null;
  state: "PLANNED" | "IN_PROGRESS" | "DONE";
  due_at: string | null;
}

export interface ProjectShowcase {
  id: number;
  project_id: number;
  summary: string;
  technology: string;
  outcomes: string;
  repository_url: string | null;
  demo_url: string | null;
  deployment_url: string | null;
  media_url: string | null;
  state: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  team_user_ids: number[];
}

export interface Project {
  id: number;
  title: string;
  summary: string;
  description: string;
  sig_id: number | null;
  lead_user_id: number;
  team_capacity: number;
  state: "PUBLISHED" | "CLOSED";
  progress: number;
  roles: ProjectRole[];
  team_memberships: ProjectMembership[];
  applications: ProjectApplication[];
}

export async function listProjects(limit = 100) {
  const { projects } = await apiRequest<{ projects: Project[] }>(`/projects?limit=${limit}`);
  return projects;
}

export async function getProject(projectId: number) {
  const { project } = await apiRequest<{ project: Project }>(`/projects/${projectId}`);
  return project;
}

export async function createRole(
  projectId: number,
  input: { title: string; description: string; capacity: number; required_skills: string[] },
) {
  const { role } = await apiRequest<{ role: ProjectRole }>(
    `/projects/${projectId}/roles`,
    { method: "POST", body: input },
  );
  return role;
}

export async function applyToRole(projectId: number, input: { role_id: number; note?: string }) {
  const { application } = await apiRequest<{ application: ProjectApplication }>(
    `/projects/${projectId}/applications`,
    { method: "POST", body: input },
  );
  return application;
}

export async function reviewApplication(
  applicationId: number,
  decision: "ACCEPT" | "REJECT",
) {
  const { application } = await apiRequest<{ application: ProjectApplication }>(
    `/projects/applications/${applicationId}/review`,
    { method: "POST", body: { decision } },
  );
  return application;
}

export async function createTask(
  projectId: number,
  input: {
    title: string;
    description?: string;
    assignee_user_id?: number | null;
    state?: ProjectTask["state"];
  },
) {
  const { task } = await apiRequest<{ task: ProjectTask }>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: input,
  });
  return task;
}

export async function updateTask(
  taskId: number,
  input: Partial<{
    title: string;
    description: string;
    assignee_user_id: number | null;
    due_at: string | null;
    state: ProjectTask["state"];
    blocker: string | null;
    weekly_update: string | null;
  }>,
) {
  const { task } = await apiRequest<{ task: ProjectTask }>(`/projects/tasks/${taskId}`, {
    method: "PATCH",
    body: input,
  });
  return task;
}

export async function createMilestone(
  projectId: number,
  input: { title: string; description?: string; state?: ProjectMilestone["state"] },
) {
  const { milestone } = await apiRequest<{ milestone: ProjectMilestone }>(
    `/projects/${projectId}/milestones`,
    { method: "POST", body: input },
  );
  return milestone;
}

export async function leaveProject(projectId: number) {
  const { membership } = await apiRequest<{ membership: ProjectMembership }>(
    `/projects/${projectId}/leave`,
    { method: "POST" },
  );
  return membership;
}

export async function upsertShowcase(
  projectId: number,
  input: {
    summary: string;
    technology: string;
    outcomes: string;
    repository_url?: string | null;
    demo_url?: string | null;
    deployment_url?: string | null;
    media_url?: string | null;
    state: "DRAFT" | "PUBLISHED";
  },
) {
  const { showcase } = await apiRequest<{ showcase: ProjectShowcase }>(
    `/projects/${projectId}/showcase`,
    { method: "POST", body: input },
  );
  return showcase;
}
