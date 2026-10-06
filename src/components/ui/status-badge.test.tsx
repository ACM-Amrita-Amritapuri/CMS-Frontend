import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge, statusLabel } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  it("turns workflow codes into readable labels", () => {
    expect(statusLabel("IN_PROGRESS")).toBe("In Progress");
  });

  it("renders a semantic status label for known states", () => {
    render(<StatusBadge status="PUBLISHED" />);

    const badge = screen.getByText("Published");
    expect(badge).toBeTruthy();
    expect(badge.className).toContain("bg-success/15");
  });

  it("falls back to an outlined badge for unknown states", () => {
    render(<StatusBadge status="WAITING_FOR_DATA" />);

    expect(screen.getByText("Waiting For Data").className).toContain("border");
  });
});
