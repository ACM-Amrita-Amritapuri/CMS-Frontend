export type RoleCode =
  | "MEMBER"
  | "SIG_CORE"
  | "SIG_LEAD"
  | "WEBMASTER"
  | "ADMIN"
  | "SUPER_ADMIN";

export interface RoleAssignment {
  role_code: RoleCode;
  sig_id: number | null;
}

export interface AuthUser {
  id: number;
  username: string;
  roll_number: string;
  must_change_password: boolean;
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
