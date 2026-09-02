import { render, screen, within } from "@testing-library/react";
import AppShell from "@/components/layout/AppShell";

describe("workspace shell", () => {
  it("exposes the primary navigation and marks the active section", () => {
    render(
      <AppShell
        activeHref="/learning"
        eyebrow="Learning"
        title="Build your path"
        description="Keep your next step visible."
      >
        <p>Page content</p>
      </AppShell>,
    );

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(within(primaryNavigation).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(within(primaryNavigation).getByRole("link", { name: "Learning" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("heading", { name: "Build your path" })).toBeVisible();
  });
});
