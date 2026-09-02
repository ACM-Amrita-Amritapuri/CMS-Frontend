import type { Capability } from "@/lib/auth/session-store";
import type { RoleAssignment, RoleCode } from "@/lib/api/types";

const capabilityRoles: Record<Capability, RoleCode[]> = {
  administer: ["ADMIN", "SUPER_ADMIN"],
  manage_content: ["SIG_CORE", "SIG_LEAD", "WEBMASTER", "ADMIN", "SUPER_ADMIN"],
  review_documentation: ["SIG_CORE", "SIG_LEAD", "WEBMASTER", "ADMIN", "SUPER_ADMIN"],
  manage_operations: ["SIG_CORE", "SIG_LEAD", "WEBMASTER", "ADMIN", "SUPER_ADMIN"],
};

const sigScopedRoles = new Set<RoleCode>(["SIG_CORE", "SIG_LEAD"]);

export function hasCapability(
  assignments: RoleAssignment[],
  capability: Capability,
  sigId?: number,
) {
  return assignments.some((assignment) => {
    if (!capabilityRoles[capability].includes(assignment.role_code)) {
      return false;
    }

    return (
      sigId === undefined ||
      (!sigScopedRoles.has(assignment.role_code) && assignment.sig_id === null) ||
      assignment.sig_id === sigId
    );
  });
}
