import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AdminAccountsPage from "@/app/(app)/admin/accounts/page";
import AdminMembersPage from "@/app/(app)/admin/members/page";
import AdminPage from "@/app/(app)/admin/page";
import AdminSigsPage from "@/app/(app)/admin/sigs/page";

afterEach(cleanup);

describe("admin prototype screens", () => {
  it("shows health, SIG, member, and account administration views", () => {
    render(<AdminPage />);
    expect(screen.getByRole("heading", { name: /Keep the club healthy/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Manage members/ })).toHaveAttribute("href", "/admin/members");
    expect(screen.getByText("Permission boundary")).toBeVisible();

    cleanup();
    render(<AdminSigsPage />);
    expect(screen.getByRole("heading", { name: "SIG management" })).toBeVisible();
    expect(screen.getByText("Web Development")).toBeVisible();

    cleanup();
    render(<AdminMembersPage />);
    expect(screen.getByRole("heading", { name: "Member management" })).toBeVisible();
    expect(screen.getByText("Aanya Sharma")).toBeVisible();

    cleanup();
    render(<AdminAccountsPage />);
    expect(screen.getByRole("heading", { name: "Account & roles" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Reset password" })[0]).toBeVisible();
  });
});
