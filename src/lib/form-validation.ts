import type { z } from "zod";

/**
 * Validate form values against a zod schema and surface issues as field
 * errors. Returns the parsed data on success, null on failure. Replaces the
 * @hookform/resolvers dependency with one tiny helper.
 */
export function parseForm<Schema extends z.ZodType>(
  schema: Schema,
  values: unknown,
  setError: (field: string, message: string) => void,
): z.output<Schema> | null {
  const result = schema.safeParse(values);
  if (result.success) return result.data;

  for (const issue of result.error.issues) {
    const field = issue.path.map(String).join(".") || "root";
    setError(field, issue.message);
  }
  return null;
}
