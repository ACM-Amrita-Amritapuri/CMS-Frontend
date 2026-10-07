import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  buildSigCreateInput,
  buildSigRoleChanges,
  getSigLeadership,
  MemberPicker,
} from "@/pages/admin/AdminSigsPage";

it("generates the internal SIG code from the name", () => {
  expect(buildSigCreateInput("Web Development")).toEqual({
    name: "Web Development",
    slug: "web-development",
  });
});

it("finds the lead and co-lead names for a SIG card", () => {
  expect(getSigLeadership(7, [
    {
      id: 1,
      username: "lead-user",
      roll_number: "L001",
      is_active: true,
      role_assignments: [{ role_code: "SIG_LEAD", sig_id: 7 }],
    },
    {
      id: 2,
      username: "core-user",
      roll_number: "C002",
      is_active: true,
      role_assignments: [{ role_code: "SIG_CORE", sig_id: 7 }],
    },
  ])).toEqual({ lead: "lead-user", coLead: "core-user" });
});

describe("buildSigRoleChanges", () => {
  it("assigns selected lead and co-lead roles for a new SIG", () => {
    expect(buildSigRoleChanges([], 7, 11, 12)).toEqual([
      { action: "assign", role_code: "SIG_LEAD", sig_id: 7, userId: 11 },
      { action: "assign", role_code: "SIG_CORE", sig_id: 7, userId: 12 },
    ]);
  });

  it("replaces existing SIG role assignments when selections change", () => {
    expect(
      buildSigRoleChanges(
        [
          {
            id: 11,
            username: "old-lead",
            roll_number: "L001",
            is_active: true,
            role_assignments: [{ role_code: "SIG_LEAD", sig_id: 7 }],
          },
          {
            id: 12,
            username: "old-core",
            roll_number: "C001",
            is_active: true,
            role_assignments: [{ role_code: "SIG_CORE", sig_id: 7 }],
          },
        ],
        7,
        13,
        null,
      ),
    ).toEqual([
      { action: "revoke", role_code: "SIG_LEAD", sig_id: 7, userId: 11 },
      { action: "assign", role_code: "SIG_LEAD", sig_id: 7, userId: 13 },
      { action: "revoke", role_code: "SIG_CORE", sig_id: 7, userId: 12 },
    ]);
  });
});

it("searches members inside the lead dropdown", () => {
  render(
    <MemberPicker
      label="Lead"
      value=""
      members={[
        { id: 1, username: "alice", roll_number: "A001", is_active: true, role_assignments: [] },
        { id: 2, username: "bob", roll_number: "B002", is_active: true, role_assignments: [] },
      ]}
      onChange={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Lead" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Search lead members" }), {
    target: { value: "B002" },
  });

  expect(screen.getByRole("button", { name: /bob.*B002/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /alice.*A001/i })).not.toBeInTheDocument();
});
