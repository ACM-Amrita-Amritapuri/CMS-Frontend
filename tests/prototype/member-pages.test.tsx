import { cleanup, render, screen } from "@testing-library/react";

import DashboardPage from "@/app/(app)/dashboard/page";
import MemberDetailPage from "@/app/(app)/members/[rollNumber]/page";
import MembersPage from "@/app/(app)/members/page";
import PortfolioPage from "@/app/(app)/portfolio/[userId]/page";
import ProfilePage from "@/app/(app)/profile/page";

describe("member prototype screens", () => {
  it("gives the dashboard a member-focused starting point", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Your activity" })).toBeVisible();
    expect(screen.getByText("Continue where you left off"))
      .toBeVisible();
  });

  it("shows a searchable member directory", () => {
    render(<MembersPage />);

    expect(screen.getByRole("heading", { name: /Find your people/ })).toBeVisible();
    expect(screen.getByLabelText("Search members")).toBeVisible();
    expect(screen.getByRole("button", { name: "Filter members" })).toBeVisible();
    expect(screen.getByText("Aanya Sharma")).toBeVisible();
  });

  it("shows profile, public member, and portfolio sections", () => {
    render(<ProfilePage />);
    expect(screen.getByRole("heading", { name: "Aanya Sharma" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Edit profile" })).toHaveAttribute("href", "/profile/setup");

    cleanup();
    render(<MemberDetailPage />);
    expect(screen.getByRole("heading", { name: "Aanya Sharma" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "About Aanya" })).toBeVisible();

    cleanup();
    render(<PortfolioPage />);
    expect(screen.getByRole("heading", { name: "Aanya’s portfolio" })).toBeVisible();
    expect(screen.getByText("Featured projects")).toBeVisible();
  });
});
