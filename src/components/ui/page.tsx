import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function ContentFrame({
  className,
  width = "standard",
  ...props
}: React.ComponentProps<"div"> & {
  width?: "reading" | "standard" | "wide";
}) {
  return (
    <div
      data-slot="content-frame"
      data-width={width}
      className={cn(
        "mx-auto w-full min-w-0 px-4 py-6 sm:px-6 sm:py-8 xl:px-8",
        width === "reading" && "max-w-3xl",
        width === "standard" && "max-w-5xl",
        width === "wide" && "max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}

function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; to?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-1 text-xs leading-5 wrap-anywhere">
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 ? <ChevronRightIcon className="size-3.5" aria-hidden /> : null}
          {item.to ? (
            <Link className="hover:text-foreground transition-colors" to={item.to}>
              {item.label}
            </Link>
          ) : (
            <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  backTo,
  actions,
  meta,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  backTo?: { label: string; to: string };
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3", className)}>
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      {backTo ? (
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to={backTo.to}>
            <ArrowLeftIcon /> {backTo.label}
          </Link>
        </Button>
      ) : null}
      {eyebrow ? <div className="text-muted-foreground text-xs font-medium">{eyebrow}</div> : null}
      <div className="flex min-w-0 flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap sm:gap-x-6">
        <div className="min-w-0 sm:flex-1 sm:basis-64">
          <h1 className="text-[2.75rem] leading-tight font-semibold tracking-tight text-balance wrap-anywhere sm:text-[3.25rem]">{title}</h1>
          {description ? <div className="text-muted-foreground mt-2 max-w-2xl truncate text-base leading-6 wrap-anywhere">{description}</div> : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:max-w-full">{actions}</div> : null}
      </div>
    </header>
  );
}

function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:max-w-full">{actions}</div> : null}
    </div>
  );
}

export { Breadcrumbs, ContentFrame, PageHeader, SectionHeader };
