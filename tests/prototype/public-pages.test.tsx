import { render, screen } from "@testing-library/react";

import ChangePasswordPage from "@/app/(account)/change-password/page";
import ProfileSetupPage from "@/app/(account)/profile/setup/page";
import LoginPage from "@/app/(public)/login/page";

describe("public prototype screens", () => {
  it("shows a complete login form and invalid-credentials example", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    expect(screen.getByLabelText(/Roll number or username/)).toBeVisible();
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
  });

  it("shows required password-change guidance", () => {
    render(<ChangePasswordPage />);

    expect(screen.getByRole("heading", { name: "Set a new password" })).toBeVisible();
    expect(screen.getByText("Temporary password"))
      .toBeVisible();
    expect(screen.getByLabelText(/^New password/)).toHaveAttribute("type", "password");
    expect(screen.getByText("At least 8 characters"))
      .toBeVisible();
  });

  it("shows profile setup fields and completion state", () => {
    render(<ProfileSetupPage />);

    expect(screen.getByRole("heading", { name: "Complete your profile" })).toBeVisible();
    expect(screen.getByLabelText(/Full name/)).toBeVisible();
    expect(screen.getByLabelText("About you")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save profile" })).toBeVisible();
    expect(screen.getByText("Profile ready to publish"))
      .toBeVisible();
  });
});
