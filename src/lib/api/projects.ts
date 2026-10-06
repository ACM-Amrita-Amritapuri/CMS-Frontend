import { apiRequest } from "@/lib/api/client";

export interface MemberGitHubProject {
  repository_id: number;
  name: string;
  description: string | null;
  language: string | null;
  repository_url: string;
  demo_url: string | null;
}

export interface ProjectDirectoryMember {
  user_id: number;
  display_name: string;
  github_url: string | null;
  projects: MemberGitHubProject[];
}

export async function listProjectDirectory(
  params: { limit: number; offset: number },
  signal?: AbortSignal,
) {
  const search = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  return apiRequest<{
    members: ProjectDirectoryMember[];
    total: number;
    limit: number;
    offset: number;
  }>(
    `/projects/directory?${search}`,
    { signal },
  );
}
