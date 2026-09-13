import { apiRequest } from "@/lib/api/client";

export interface DashboardSummary {
  total_users: number;
  active_users: number;
  incomplete_profiles: number;
  total_sigs: number;
  active_sigs: number;
  role_counts: Record<string, number>;
}

export interface Sig {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface AdminMember {
  id: number;
  username: string;
  roll_number: string;
  is_active: boolean;
  role_assignments: { role_code: string; sig_id: number | null }[];
}

export async function getDashboardSummary() {
  const { summary } = await apiRequest<{ summary: DashboardSummary }>(
    "/admin/dashboard",
  );
  return summary;
}

export async function listSigs(limit = 100) {
  const { sigs } = await apiRequest<{ sigs: Sig[] }>(
    `/admin/sigs?limit=${limit}`,
  );
  return sigs;
}

export async function createSig(input: { name: string; slug: string }) {
  const { sig } = await apiRequest<{ sig: Sig }>("/admin/sigs", {
    method: "POST",
    body: input,
  });
  return sig;
}

export async function updateSig(
  sigId: number,
  input: { name?: string; slug?: string; is_active?: boolean },
) {
  const { sig } = await apiRequest<{ sig: Sig }>(`/admin/sigs/${sigId}`, {
    method: "PUT",
    body: input,
  });
  return sig;
}

export async function listAdminMembers(params: {
  limit?: number;
  is_active?: boolean;
}) {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.is_active !== undefined)
    search.set("is_active", String(params.is_active));
  const { members } = await apiRequest<{ members: AdminMember[] }>(
    `/admin/members?${search}`,
  );
  return members;
}

export async function setMemberStatus(userId: number, isActive: boolean) {
  const { member } = await apiRequest<{ member: AdminMember }>(
    `/admin/members/${userId}/status`,
    { method: "PATCH", body: { is_active: isActive } },
  );
  return member;
}

export async function createAccount(input: { username: string; roll_number: string }) {
  return apiRequest<{
    user: { id: number; username: string; roll_number: string };
    temporary_password: string;
  }>("/auth/users", { method: "POST", body: input });
}

export async function resetPassword(userId: number) {
  return apiRequest<{
    user_id: number;
    temporary_password: string;
    expires_at: string;
  }>(`/auth/users/${userId}/reset-password`, { method: "POST" });
}

export async function changeRoles(
  userId: number,
  input: { action: "assign" | "revoke"; role_code: string; sig_id: number | null },
) {
  return apiRequest<{ message: string }>(`/auth/users/${userId}/roles`, {
    method: "PUT",
    body: input,
  });
}
