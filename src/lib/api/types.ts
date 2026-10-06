export const ROLE_CODES = ["MEMBER", "SIG_CORE", "SIG_LEAD", "WEBMASTER", "ADMIN", "SUPER_ADMIN"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export interface RoleAssignment {
  role_code: RoleCode;
  sig_id: number | null;
}

export interface AuthUser {
  id: number;
  username: string;
  roll_number: string;
  must_change_password: boolean;
  profile_complete?: boolean;
  role_assignments: RoleAssignment[];
}

export interface AuthLoginResponse {
  access_token: string;
  token_type: "Bearer" | string;
  user: AuthUser;
}

export interface AuthRefreshResponse {
  access_token: string;
  token_type: "Bearer" | string;
}
