import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { ROLE_CODES } from "@/lib/api/types";

export const authUserSchema = z.looseObject({
  id: z.number().int().positive(),
  username: z.string().min(1),
  roll_number: z.string(),
  must_change_password: z.boolean(),
  profile_complete: z.boolean().optional(),
  role_assignments: z.array(z.looseObject({
    role_code: z.enum(ROLE_CODES),
    sig_id: z.number().int().positive().nullable(),
  })),
});

export const authRefreshSchema = z.looseObject({
  access_token: z.string().trim().min(1),
  token_type: z.string().min(1),
});

export const authLoginSchema = authRefreshSchema.extend({ user: authUserSchema });
export const authMeSchema = z.looseObject({ user: authUserSchema });

export function validateAuthResponse<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ApiError(502, "INVALID_RESPONSE", "The server returned an invalid authentication response.");
  }
  return result.data;
}
