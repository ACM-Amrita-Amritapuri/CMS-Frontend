import "@testing-library/jest-dom/vitest";
import { createRef } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";

import { Field, Input, Textarea } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

afterEach(cleanup);

it.each([
  ["Input", <Input />],
  ["Textarea", <Textarea />],
  ["NativeSelect", <NativeSelect><option>One</option></NativeSelect>],
  ["input", <input />],
  ["textarea", <textarea />],
  ["select", <select><option>One</option></select>],
])("associates a generated label, hint, and error with %s", (_, child) => {
  const { rerender } = render(<Field label="Details" hint="Helpful hint">{child}</Field>);
  const control = screen.getByLabelText("Details");
  const controlId = control.id;
  const hintId = screen.getByText("Helpful hint").id;

  expect(controlId).not.toBe("");
  expect(hintId).not.toBe("");
  expect(control).toHaveAttribute("aria-describedby", hintId);
  expect(control).toHaveAccessibleDescription("Helpful hint");
  expect(control).not.toHaveAttribute("aria-invalid");

  rerender(<Field label="Details" hint="Helpful hint" error="Required">{child}</Field>);
  const error = screen.getByRole("alert");
  expect(control).toHaveAttribute("id", controlId);
  expect(error.id).not.toBe("");
  expect(error.id).not.toBe(hintId);
  expect(control).toHaveAttribute("aria-describedby", error.id);
  expect(control).toHaveAccessibleDescription("Required");
  expect(control).toHaveAttribute("aria-invalid", "true");
  expect(screen.queryByText("Helpful hint")).not.toBeInTheDocument();

  rerender(<Field label="Details" hint="Helpful hint">{child}</Field>);
  expect(control).toHaveAttribute("aria-describedby", hintId);
  expect(control).not.toHaveAttribute("aria-invalid");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  rerender(<Field label="Details">{child}</Field>);
  expect(control).toHaveAttribute("id", controlId);
  expect(control).not.toHaveAttribute("aria-describedby");
});

it("uses htmlFor when the control has no explicit ID", () => {
  render(<Field label="Name" htmlFor="name"><Input /></Field>);
  expect(screen.getByLabelText("Name")).toHaveAttribute("id", "name");
});

it("preserves an explicit control ID and associates the label with it", () => {
  render(<Field label="Name" htmlFor="fallback"><Input id="custom-name" /></Field>);
  expect(screen.getByLabelText("Name")).toHaveAttribute("id", "custom-name");
});

it("merges external descriptions and preserves explicit invalid state without a Field error", () => {
  const { rerender } = render(
    <>
      <p id="external">External help</p>
      <p id="format">Expected format</p>
      <Field label="Name" hint="Field help">
        <Input aria-describedby="external format" aria-invalid="grammar" />
      </Field>
    </>,
  );
  const control = screen.getByLabelText("Name");
  expect(control).toHaveAttribute("aria-describedby", `external format ${screen.getByText("Field help").id}`);
  expect(control).toHaveAccessibleDescription("External help Expected format Field help");
  expect(control).toHaveAttribute("aria-invalid", "grammar");

  rerender(
    <>
      <p id="external">External help</p>
      <p id="format">Expected format</p>
      <Field label="Name" error="Required">
        <Input aria-describedby="external format" aria-invalid={false} />
      </Field>
    </>,
  );
  expect(control).toHaveAttribute("aria-describedby", `external format ${screen.getByRole("alert").id}`);
  expect(control).toHaveAttribute("aria-invalid", "true");

  rerender(
    <>
      <p id="external">External help</p>
      <p id="format">Expected format</p>
      <Field label="Name"><Input aria-describedby="external format" aria-invalid={false} /></Field>
    </>,
  );
  expect(control).toHaveAttribute("aria-describedby", "external format");
  expect(control).toHaveAttribute("aria-invalid", "false");
});

it("assigns unique IDs to separate fields", () => {
  render(
    <>
      <Field label="First" hint="First hint"><Input /></Field>
      <Field label="Second" error="Second error"><Input /></Field>
    </>,
  );
  const first = screen.getByLabelText("First");
  const second = screen.getByLabelText("Second");
  const ids = [first.id, second.id, screen.getByText("First hint").id, screen.getByRole("alert").id];
  expect(new Set(ids).size).toBe(ids.length);
  expect(first).toHaveAccessibleDescription("First hint");
  expect(second).toHaveAccessibleDescription("Second error");
  expect(first).not.toHaveAttribute("aria-invalid");
});

it("associates only the matching control when there are sibling actions", () => {
  render(
    <Field label="Slug" htmlFor="slug" error="Invalid slug">
      <button type="button">Before</button>
      <Input id="slug" />
      {false}
      <button type="button">Reset slug</button>
    </Field>,
  );
  expect(screen.getByLabelText("Slug")).toHaveAccessibleDescription("Invalid slug");
  for (const button of screen.getAllByRole("button")) {
    expect(button).not.toHaveAttribute("id");
    expect(button).not.toHaveAttribute("aria-describedby");
    expect(button).not.toHaveAttribute("aria-invalid");
  }
});

it("preserves control refs, handlers, and other props", () => {
  const ref = createRef<HTMLInputElement>();
  const onChange = vi.fn();
  render(
    <Field label="Name" hint="Your name">
      <Input ref={ref} name="name" defaultValue="Before" onChange={onChange} className="custom-input" required />
    </Field>,
  );
  const control = screen.getByLabelText("Name");
  expect(ref.current).toBe(control);
  expect(control).toHaveAttribute("name", "name");
  expect(control).toHaveClass("custom-input");
  expect(control).toBeRequired();
  fireEvent.change(control, { target: { value: "After" } });
  expect(onChange).toHaveBeenCalledOnce();
  expect(control).toHaveValue("After");
});

it("keeps react-hook-form registration and error focus working", async () => {
  const submit = vi.fn();
  function Form() {
    const { register, handleSubmit, formState: { errors } } = useForm<{ name: string }>();
    return (
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" {...register("name", { required: "Name required" })} />
        </Field>
        <button type="submit">Save</button>
      </form>
    );
  }
  render(<Form />);
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Name required");
  const control = screen.getByLabelText("Name");
  expect(control).toHaveAccessibleDescription("Name required");
  expect(control).toHaveAttribute("aria-invalid", "true");
  expect(control).toHaveFocus();
  fireEvent.change(control, { target: { value: "Ada" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledOnce());
  expect(submit.mock.calls[0][0]).toEqual({ name: "Ada" });
  expect(control).not.toHaveAttribute("aria-invalid");
});
