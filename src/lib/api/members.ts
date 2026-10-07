import { apiRequest } from "@/lib/api/client";
import type { MemberGitHubProject } from "@/lib/api/projects";

export interface ProfileView {
  user_id: number;
  roll_number: string;
  real_name: string;
  year: number | null;
  branch: string;
  about: string;
  skills: string[];
  interests: string;
  hobbies: string;
  github_url: string | null;
  linkedin_url: string | null;
  leetcode_url: string | null;
  codechef_url: string | null;
  codeforces_url: string | null;
  hackerrank_url: string | null;
  is_complete: boolean;
  created_at: string | null;
  username: string;
  club_role: {
    assignments: { role_code: string; sig_id: number | null }[];
    sig_info: Record<string, string>;
  } | null;
}

export interface ProfileInput {
  real_name?: string;
  year?: number | null;
  branch?: string;
  about?: string;
  skills?: string[];
  interests?: string;
  hobbies?: string;
  github_url?: string | null;
  linkedin_url?: string | null;
  leetcode_url?: string | null;
  codechef_url?: string | null;
  codeforces_url?: string | null;
  hackerrank_url?: string | null;
}

export async function getMyProfile(signal?: AbortSignal) {
  const { profile } = await apiRequest<{ profile: ProfileView }>("/members/me", { signal });
  return profile;
}

/**
 * Initialize a missing profile. Normally accounts are created with a blank
 * profile; this covers genuinely missing ones (e.g. the bootstrapped super
 * admin), targeting self by username.
 */
export async function initializeMyProfile(username: string, signal?: AbortSignal) {
  const { profile } = await apiRequest<{ profile: ProfileView }>("/members", {
    method: "POST",
    signal,
    body: { username },
  });
  return profile;
}

export async function updateMyProfile(input: ProfileInput) {
  const { profile } = await apiRequest<{ profile: ProfileView }>("/members/me", {
    method: "PUT",
    body: input,
  });
  return profile;
}

export async function getMemberByRoll(rollNumber: string, signal?: AbortSignal) {
  const { profile } = await apiRequest<{ profile: ProfileView }>(
    `/members/${encodeURIComponent(rollNumber)}`,
    { signal },
  );
  return profile;
}

export async function getPortfolio(userId: number, signal?: AbortSignal) {
  const { portfolio } = await apiRequest<{ portfolio: PortfolioView }>(
    `/members/${userId}/portfolio`,
    { signal },
  );
  return portfolio;
}

export interface PortfolioView {
  profile: ProfileView;
  learning_achievements: {
    id: number;
    path_id: number;
    module_id: number;
    path_title?: string | null;
    module_title?: string | null;
    content_type: "LESSON" | "ASSIGNMENT";
    content_id: number;
    completed_at: string | null;
  }[];
  github_projects: MemberGitHubProject[];
}
