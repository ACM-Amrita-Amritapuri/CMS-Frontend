import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import OperationsAnnouncementsPage from "@/app/(app)/operations/announcements/page";
import OperationsCalendarPage from "@/app/(app)/operations/calendar/page";
import OperationsEventsPage from "@/app/(app)/operations/events/page";
import OperationsPage from "@/app/(app)/operations/page";
import ProjectDetailPage from "@/app/(app)/projects/[slug]/page";
import ProjectNewPage from "@/app/(app)/projects/new/page";
import ProjectShowcasePage from "@/app/(app)/projects/showcase/page";
import ProjectsPage from "@/app/(app)/projects/page";

afterEach(cleanup);

describe("project and operations prototype screens", () => {
  it("shows project discovery, context, creation, and showcase", () => {
    render(<ProjectsPage />);
    expect(screen.getByRole("heading", { name: "Turn ideas into visible work." })).toBeVisible();
    expect(screen.getByRole("link", { name: /Website refresh/ })).toHaveAttribute("href", "/projects/website-refresh");

    cleanup();
    render(<ProjectDetailPage />);
    expect(screen.getByRole("heading", { name: "Website refresh" })).toBeVisible();
    expect(screen.getByText("Aanya Sharma")).toBeVisible();

    cleanup();
    render(<ProjectNewPage />);
    expect(screen.getByRole("heading", { name: "Create a project" })).toBeVisible();
    expect(screen.getByLabelText(/Project name/)).toBeVisible();

    cleanup();
    render(<ProjectShowcasePage />);
    expect(screen.getByRole("heading", { name: "Project showcase" })).toBeVisible();
    expect(screen.getByText("Website refresh")).toBeVisible();
  });

  it("shows operations overview, announcements, events, and calendar", () => {
    render(<OperationsPage />);
    expect(screen.getByRole("heading", { name: /Keep the club moving/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /See all/ })).toHaveAttribute("href", "/operations/events");

    cleanup();
    render(<OperationsAnnouncementsPage />);
    expect(screen.getByRole("heading", { name: "Announcements" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Published/ })).toBeVisible();

    cleanup();
    render(<OperationsEventsPage />);
    expect(screen.getByRole("heading", { name: "Events & meetings" })).toBeVisible();
    expect(screen.getByText("Spring SIG kickoff")).toBeVisible();

    cleanup();
    render(<OperationsCalendarPage />);
    expect(screen.getByRole("heading", { name: "Club calendar" })).toBeVisible();
    expect(screen.getByText("March 2026")).toBeVisible();
  });
});
