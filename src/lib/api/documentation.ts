import { apiRequest } from "@/lib/api/client";

export type DocumentState =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "ARCHIVED";

export interface ClubDocument {
  id: number;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  body?: string;
  sig_id: number | null;
  owner_user_id: number;
  state: DocumentState;
  review_comment: string | null;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
}

export interface DocumentRevision {
  id: number;
  revision_number: number;
  title: string;
  summary: string;
  category: string;
  body: string;
  created_by_user_id: number;
  created_at: string;
}

type WorkflowAction = "submit" | "publish" | "archive" | "restore";

export interface Page {
  total: number;
  limit: number;
  offset: number;
}

export async function listDocuments(
  params: number | { limit?: number; offset?: number } = {},
  signal?: AbortSignal,
) {
  const limit = typeof params === "number" ? params : params.limit ?? 100;
  const offset = typeof params === "number" ? 0 : params.offset ?? 0;
  const search = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiRequest<{ documents: ClubDocument[] } & Page>(
    `/documentation/documents?${search}`,
    { signal },
  );
}

export async function searchDocuments(params: {
  q?: string;
  tag?: string;
  category?: string;
  limit?: number;
  offset?: number;
}, signal?: AbortSignal) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.tag) search.set("tag", params.tag);
  if (params.category) search.set("category", params.category);
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  return apiRequest<{ documents: ClubDocument[] } & Page>(
    `/documentation/search?${search}`,
    { signal },
  );
}

export async function getDocument(documentId: number, signal?: AbortSignal) {
  const { document } = await apiRequest<{ document: ClubDocument }>(
    `/documentation/documents/${documentId}`,
    { signal },
  );
  return document;
}

export async function createDocument(input: {
  title: string;
  body: string;
  summary?: string;
  category?: string;
  tags?: string[];
  sig_id?: number | null;
}) {
  const { document } = await apiRequest<{ document: ClubDocument }>(
    "/documentation/documents",
    { method: "POST", body: input },
  );
  return document;
}

export async function updateDocument(
  documentId: number,
  input: {
    title?: string;
    summary?: string;
    body?: string;
    category?: string;
    tags?: string[];
    sig_id?: number | null;
  },
) {
  const { document } = await apiRequest<{ document: ClubDocument }>(
    `/documentation/documents/${documentId}`,
    { method: "PATCH", body: input },
  );
  return document;
}

export async function runDocumentAction(documentId: number, action: WorkflowAction) {
  const { document } = await apiRequest<{ document: ClubDocument }>(
    `/documentation/documents/${documentId}/${action}`,
    { method: "POST" },
  );
  return document;
}

export async function reviewDocument(
  documentId: number,
  input: { decision: "APPROVE" | "REJECT"; comment: string },
) {
  const { document } = await apiRequest<{ document: ClubDocument }>(
    `/documentation/documents/${documentId}/review`,
    { method: "POST", body: input },
  );
  return document;
}

export async function listRevisions(documentId: number, signal?: AbortSignal) {
  const { revisions } = await apiRequest<{ revisions: DocumentRevision[] }>(
    `/documentation/documents/${documentId}/revisions`,
    { signal },
  );
  return revisions;
}
