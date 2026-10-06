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

export async function listProjectDirectory(signal?: AbortSignal) {
  const { members } = await apiRequest<{ members: ProjectDirectoryMember[] }>(
    "/projects/directory",
    { signal },
  );
  return members;
}
