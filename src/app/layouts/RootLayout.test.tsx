import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ApplicationErrorBoundary } from "@/app/layouts/RootLayout";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("contains render failures without exposing details and can recover", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  let fail = true;
  function Child() {
    if (fail) throw new Error("private failure details");
    return <p>Recovered content</p>;
  }
  render(<ApplicationErrorBoundary><Child /></ApplicationErrorBoundary>);
  expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  expect(screen.queryByText("private failure details")).not.toBeInTheDocument();
  fail = false;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.getByText("Recovered content")).toBeInTheDocument();
});
