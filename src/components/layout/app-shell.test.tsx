import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { Providers } from "@/app/providers";
import { AppShell } from "@/components/layout/app-shell";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  Element.prototype.scrollIntoView = vi.fn();
});

function renderShell() {
  return render(
    <Providers>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppShell><div>Content</div></AppShell>
      </MemoryRouter>
    </Providers>,
  );
}

describe("AppShell navigation", () => {
  it("collapses and expands the desktop navigation labels", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "Learning" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));

    expect(screen.getByRole("button", { name: "Expand navigation" })).toBeInTheDocument();
    expect(localStorage.getItem("cms-sidebar-collapsed")).toBe("true");
    expect(screen.queryByText("Learning", { selector: "li a" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learning" })).toHaveAttribute("title", "Learning");

    fireEvent.click(screen.getByRole("button", { name: "Expand navigation" }));
    expect(screen.getByText("Learning", { selector: "li a" })).toBeInTheDocument();
  });

  it("keeps the duplicate profile avatar out of the top bar", () => {
    renderShell();

    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument();
  });

  it("loads the quick switcher only when opened", async () => {
    renderShell();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open quick switcher" }));

    await waitFor(() => expect(screen.getByRole("dialog", { name: "Quick switcher" })).toBeInTheDocument());
    expect(screen.getByPlaceholderText("Go to…")).toBeInTheDocument();
  });
});
