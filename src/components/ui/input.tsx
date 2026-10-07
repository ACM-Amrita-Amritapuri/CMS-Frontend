import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input glass flex h-13 w-full min-w-0 rounded-2xl border-[1.5px] bg-card/80 px-4 py-1 text-sm outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive glass flex field-sizing-content min-h-16 w-full rounded-2xl border-[1.5px] bg-card/80 px-4 py-3 text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-destructive text-xs font-medium">
      {children}
    </p>
  );
}

/**
 * Horizontal form field: label + control + error, works with plain inputs or
 * react-hook-form register props passed through `render`.
 */
function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const generatedId = React.useId();
  const childNodes = React.Children.toArray(children);
  const controls = childNodes.filter(
    React.isValidElement<React.HTMLAttributes<HTMLElement>>,
  );
  const control = controls.find((child) => htmlFor && child.props.id === htmlFor) ?? controls[0];
  const controlId = control?.props.id ?? htmlFor ?? `${generatedId}-control`;
  const errorId = `${generatedId}-error`;
  const hintId = `${generatedId}-hint`;
  const descriptionId = error ? errorId : hint ? hintId : undefined;
  const describedBy = [control?.props["aria-describedby"], descriptionId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)} data-slot="field">
      <Label htmlFor={controlId}>{label}</Label>
      {childNodes.map((child) =>
        React.isValidElement<React.HTMLAttributes<HTMLElement>>(child) && child === control
          ? React.cloneElement(child, {
              id: controlId,
              "aria-describedby": describedBy,
              "aria-invalid": error ? true : child.props["aria-invalid"],
            })
          : child,
      )}
      {hint && !error ? (
        <p id={hintId} className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

export { Input, Textarea, Field };
