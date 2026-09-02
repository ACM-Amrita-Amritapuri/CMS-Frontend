import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("application shell", () => {
  it("shows the CMS title and primary navigation", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "A calmer way to build together." }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Open workspace" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /Learning/ })).toHaveAttribute(
      "href",
      "/learning",
    );
  });
});
