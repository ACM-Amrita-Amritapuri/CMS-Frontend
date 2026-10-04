import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-6 items-center justify-center rounded-[0.25rem] border bg-transparent px-4 py-1 text-[10px] font-semibold tracking-wide text-accent w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:size-3 transition-colors",
  {
    variants: {
      variant: {
        default: "border-0 bg-transparent text-accent",
        secondary: "border bg-transparent text-accent",
        destructive: "border-0 bg-transparent text-accent",
        success: "border-0 bg-transparent text-accent",
        warning: "border-0 bg-transparent text-accent",
        info: "border-0 bg-transparent text-accent",
        outline: "border-0 bg-transparent text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge };
