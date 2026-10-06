import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import HomePage from "@/pages/HomePage";
import { useSessionBootstrap } from "@/components/auth/use-session-bootstrap";

vi.mock("@/components/auth/use-session-bootstrap", () => ({
  useSessionBootstrap: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("sends signed-out visitors to login", async () => {
    vi.mocked(useSessionBootstrap).mockReturnValue({
      status: "signed-out",
      error: undefined,
      retry: vi.fn(),
    });

    renderHome();

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("sends authenticated visitors to the dashboard", async () => {
    vi.mocked(useSessionBootstrap).mockReturnValue({
      status: "ready",
      error: undefined,
      retry: vi.fn(),
    });

    renderHome();

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });
});
