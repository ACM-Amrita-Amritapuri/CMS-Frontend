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

export interface AdminMemberPage {
  members: AdminMember[];
  total: number;
  limit: number;
  offset: number;
}

export async function getDashboardSummary(signal?: AbortSignal) {
  const { summary } = await apiRequest<{ summary: DashboardSummary }>(
    "/admin/dashboard",
    { signal },
  );
  return summary;
}

export async function listSigs(limit = 100, signal?: AbortSignal) {
  const { sigs } = await apiRequest<{ sigs: Sig[] }>(
    `/admin/sigs?${new URLSearchParams({ limit: String(limit), offset: "0" })}`,
    { signal },
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
  offset?: number;
  is_active?: boolean;
  search?: string;
  sig_id?: number;
}, signal?: AbortSignal) {
  const search = new URLSearchParams();
  search.set("limit", String(params.limit ?? 100));
  search.set("offset", String(params.offset ?? 0));
  if (params.is_active !== undefined)
    search.set("is_active", String(params.is_active));
  if (params.search) search.set("search", params.search);
  if (params.sig_id !== undefined) search.set("sig_id", String(params.sig_id));
  return apiRequest<AdminMemberPage & { items?: AdminMember[] }>(
    `/admin/members?${search}`,
    { signal },
  );
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
