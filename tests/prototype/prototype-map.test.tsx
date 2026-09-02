import { render, screen, within } from "@testing-library/react";

import AppShell from "@/components/layout/AppShell";
import PrototypePage from "@/app/prototype/page";

describe("prototype map", () => {
  it("links designers to every major CMS screen", () => {
    render(<PrototypePage />);

    const routes = [
      ["Login", "/login"],
      ["Dashboard", "/dashboard"],
      ["Profile", "/profile"],
      ["Members", "/members"],
      ["Learning", "/learning"],
      ["Documentation", "/documentation"],
      ["Projects", "/projects"],
      ["Operations", "/operations"],
      ["Admin", "/admin"],
    ] as const;

    for (const [label, href] of routes) {
      const link = screen
        .getAllByRole("link")
        .find((candidate) => candidate.getAttribute("href") === href);

      expect(link, `${label} route is missing`).toBeDefined();
      expect(link).toHaveAttribute("href", href);
    }
  });

  it("exposes admin in the shared workspace navigation", () => {
    render(
      <AppShell
        activeHref="/admin"
        eyebrow="Administration"
        title="Keep the club healthy"
        description="Manage the pieces that need a steady hand."
      >
        <p>Admin preview</p>
      </AppShell>,
    );

    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(within(primaryNavigation).getByRole("link", { name: "Admin" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
