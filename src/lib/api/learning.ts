import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export type PublicationState = "DRAFT" | "PUBLISHED";

export interface LearningPath {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  sig_id: number | null;
  publication_state: PublicationState;
  modules?: LearningModule[];
}

export interface LearningModule {
  id: number;
  title: string;
  slug: string;
  position: number;
  publication_state: PublicationState;
  lessons: LearningLesson[];
  assignments: LearningAssignment[];
}

export interface LearningLesson {
  id: number;
  title: string;
  slug: string;
  position: number;
  publication_state: PublicationState;
  resources: LearningResource[];
}

export interface LearningResource {
  id: number;
  title: string;
  resource_type: "MARKDOWN" | "EXTERNAL_LINK";
  content: string | null;
  external_url: string | null;
  position: number;
  publication_state: PublicationState;
}

export interface LearningAssignment {
  id: number;
  title: string;
  instructions: string;
  assignment_type: "TEXT" | "LINK";
  position: number;
  deadline_at: string | null;
  publication_state: PublicationState;
}

export interface LearningSubmission {
  id: number;
  assignment_id: number;
  member_user_id?: number;
  member_username?: string;
  submission_state: "DRAFT" | "SUBMITTED" | "REVIEWED";
  content: string | null;
  external_url: string | null;
  submitted_at: string | null;
  feedback: string | null;
  score: number | null;
  reviewed_at: string | null;
}

export interface PathProgress {
  path_id: number;
  completed_items: number;
  total_items: number;
  percent_complete: number;
  modules: {
    module_id: number;
    completed_items: number;
    total_items: number;
    percent_complete: number;
  }[];
}

const limit = (value: number) => `?limit=${value}`;

export async function listPaths(signal?: AbortSignal) {
  const { paths } = await apiRequest<{ paths: LearningPath[] }>(
    `/learning/paths${limit(100)}`,
    { signal },
  );
  return paths;
}

export async function getPath(pathId: number, signal?: AbortSignal) {
  const { path } = await apiRequest<{ path: LearningPath }>(
    `/learning/paths/${pathId}`,
    { signal },
  );
  return path;
}

export async function createPath(input: {
  title: string;
  slug: string;
  description?: string | null;
  sig_id?: number | null;
}) {
  const { path } = await apiRequest<{ path: LearningPath }>("/learning/paths", {
    method: "POST",
    body: input,
  });
  return path;
}

export async function setPathState(pathId: number, publication_state: PublicationState) {
  const { path } = await apiRequest<{ path: LearningPath }>(
    `/learning/paths/${pathId}`,
    { method: "PATCH", body: { publication_state } },
  );
  return path;
}

export async function createModule(pathId: number, input: { title: string; slug: string; position: number }) {
  const { module } = await apiRequest<{ module: LearningModule }>(
    `/learning/paths/${pathId}/modules`,
    { method: "POST", body: input },
  );
  return module;
}

export async function setModuleState(moduleId: number, publication_state: PublicationState) {
  const { module } = await apiRequest<{ module: LearningModule }>(
    `/learning/modules/${moduleId}`,
    { method: "PATCH", body: { publication_state } },
  );
  return module;
}

export async function createLesson(moduleId: number, input: { title: string; slug: string; position: number }) {
  const { lesson } = await apiRequest<{ lesson: LearningLesson }>(
    `/learning/modules/${moduleId}/lessons`,
    { method: "POST", body: input },
  );
  return lesson;
}

export async function setLessonState(lessonId: number, publication_state: PublicationState) {
  const { lesson } = await apiRequest<{ lesson: LearningLesson }>(
    `/learning/lessons/${lessonId}`,
    { method: "PATCH", body: { publication_state } },
  );
  return lesson;
}

export async function createResource(
  lessonId: number,
  input: {
    title: string;
    resource_type: "MARKDOWN" | "EXTERNAL_LINK";
    position: number;
    content?: string;
    external_url?: string;
  },
) {
  const { resource } = await apiRequest<{ resource: LearningResource }>(
    `/learning/lessons/${lessonId}/resources`,
    { method: "POST", body: input },
  );
  return resource;
}

export async function setResourceState(resourceId: number, publication_state: PublicationState) {
  const { resource } = await apiRequest<{ resource: LearningResource }>(
    `/learning/resources/${resourceId}`,
    { method: "PATCH", body: { publication_state } },
  );
  return resource;
}

export async function createAssignment(
  moduleId: number,
  input: {
    title: string;
    instructions: string;
    assignment_type: "TEXT" | "LINK";
    position: number;
    deadline_at: string | null;
  },
) {
  const { assignment } = await apiRequest<{ assignment: LearningAssignment }>(
    `/learning/modules/${moduleId}/assignments`,
    { method: "POST", body: input },
  );
  return assignment;
}

export async function setAssignmentState(assignmentId: number, publication_state: PublicationState) {
  const { assignment } = await apiRequest<{ assignment: LearningAssignment }>(
    `/learning/assignments/${assignmentId}`,
    { method: "PATCH", body: { publication_state } },
  );
  return assignment;
}

export async function getMySubmission(assignmentId: number, signal?: AbortSignal) {
  try {
    const { submission } = await apiRequest<{ submission: LearningSubmission }>(
      `/learning/assignments/${assignmentId}/submission`, { signal },
    );
    return submission;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function listSubmissions(assignmentId: number, signal?: AbortSignal) {
  const { submissions } = await apiRequest<{ submissions: LearningSubmission[] }>(
    `/learning/assignments/${assignmentId}/submissions`, { signal },
  );
  return submissions;
}

export async function submitAssignment(
  assignmentId: number,
  input: { submission_state: "DRAFT" | "FINAL"; content?: string; external_url?: string },
) {
  const { submission } = await apiRequest<{ submission: LearningSubmission }>(
    `/learning/assignments/${assignmentId}/submissions`,
    { method: "POST", body: input },
  );
  return submission;
}

export async function reviewSubmission(
  submissionId: number,
  input: { feedback?: string; score?: number },
) {
  const { submission } = await apiRequest<{ submission: LearningSubmission }>(
    `/learning/submissions/${submissionId}/review`,
    { method: "PATCH", body: input },
  );
  return submission;
}

export async function completeLesson(lessonId: number) {
  return apiRequest<{ message: string }>(`/learning/lessons/${lessonId}/complete`, {
    method: "POST",
  });
}

export async function getPathProgress(pathId: number, signal?: AbortSignal) {
  const { progress } = await apiRequest<{ progress: PathProgress }>(
    `/learning/paths/${pathId}/progress`,
    { signal },
  );
  return progress;
}
