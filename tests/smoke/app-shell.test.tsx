import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("application shell", () => {
  it("shows the CMS title and primary navigation", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "ACM CMS" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
