import { apiRequest } from "@/lib/api/client";

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

export async function getMyProfile() {
  const { profile } = await apiRequest<{ profile: ProfileView }>("/members/me");
  return profile;
}

export async function updateMyProfile(input: ProfileInput) {
  const { profile } = await apiRequest<{ profile: ProfileView }>("/members/me", {
    method: "PUT",
    body: input,
  });
  return profile;
}

export async function getMemberByRoll(rollNumber: string) {
  const { profile } = await apiRequest<{ profile: ProfileView }>(
    `/members/${encodeURIComponent(rollNumber)}`,
  );
  return profile;
}

export async function getPortfolio(userId: number) {
  const { portfolio } = await apiRequest<{ portfolio: PortfolioView }>(
    `/members/${userId}/portfolio`,
  );
  return portfolio;
}

export interface PortfolioView {
  profile: ProfileView;
  learning_achievements: {
    id: number;
    path_id: number;
    module_id: number;
    content_type: "LESSON" | "ASSIGNMENT" | "QUIZ";
    content_id: number;
    completed_at: string | null;
  }[];
  project_contributions: {
    project_id: number;
    title: string;
    summary: string;
    role_id: number | null;
    is_lead: boolean;
    joined_at: string | null;
    left_at: string | null;
  }[];
  showcases: {
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
  }[];
}
