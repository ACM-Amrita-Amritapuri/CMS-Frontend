import { cleanup, render, screen } from "@testing-library/react";

import DocumentationPage from "@/app/(app)/documentation/page";
import DocumentationDetailPage from "@/app/(app)/documentation/[slug]/page";
import DocumentationNewPage from "@/app/(app)/documentation/new/page";
import DocumentationReviewPage from "@/app/(app)/documentation/review/page";
import LearningPage from "@/app/(app)/learning/page";
import LearningAssignmentsPage from "@/app/(app)/learning/assignments/page";
import LearningPathPage from "@/app/(app)/learning/path/[slug]/page";
import LearningProgressPage from "@/app/(app)/learning/progress/page";

describe("learning and documentation prototype screens", () => {
  it("shows learning paths and progress entry points", () => {
    render(<LearningPage />);

      expect(screen.getByRole("heading", { name: /Learn with a clear next step/ })).toBeVisible();
      expect(screen.getByRole("link", { name: /Frontend foundations/ })).toHaveAttribute("href", "/learning/path/frontend-foundations");

      cleanup();
      render(<LearningPathPage />);
    expect(screen.getByRole("heading", { name: "Frontend foundations" })).toBeVisible();
    expect(screen.getByText("Lesson 3 of 8")).toBeVisible();

      cleanup();
      render(<LearningAssignmentsPage />);
    expect(screen.getByRole("heading", { name: "Your assignments" })).toBeVisible();
    expect(screen.getByText("Due this week")).toBeVisible();

      cleanup();
      render(<LearningProgressPage />);
    expect(screen.getByRole("heading", { name: "Your progress" })).toBeVisible();
    expect(screen.getByText("4 paths completed")).toBeVisible();
  });

  it("shows documentation discovery, reading, editing, and review", () => {
    render(<DocumentationPage />);
      expect(screen.getByRole("heading", { name: /Find what the club knows/ })).toBeVisible();
      expect(screen.getByLabelText("Search documentation")).toBeVisible();
      expect(screen.getByRole("link", { name: /How we review project briefs/ })).toHaveAttribute("href", "/documentation/getting-started");

      cleanup();
      render(<DocumentationDetailPage />);
    expect(screen.getByRole("heading", { name: "How we review project briefs" })).toBeVisible();
    expect(screen.getByText("Web Development SIG")).toBeVisible();

      cleanup();
      render(<DocumentationNewPage />);
    expect(screen.getByRole("heading", { name: "Create a document" })).toBeVisible();
    expect(screen.getByLabelText(/Document title/)).toBeVisible();

      cleanup();
      render(<DocumentationReviewPage />);
    expect(screen.getByRole("heading", { name: "Review queue" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Approve document" })).toBeVisible();
  });
});
