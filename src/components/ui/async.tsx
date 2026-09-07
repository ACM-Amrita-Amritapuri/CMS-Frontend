"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { RefreshCwIcon } from "lucide-react";

interface AsyncBoundaryProps<T> {
  query: ReturnType<typeof useQuery<T>>;
  children: (data: T) => React.ReactNode;
  empty?: {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  /** Normalize a non-empty check (e.g. lists return `{ items: [] }`). */
  isEmpty?: (data: T) => boolean;
  skeleton?: React.ReactNode;
}

/**
 * Single loading/error/empty/success renderer for every data-backed screen so
 * all pages have consistent async states without repeating logic.
 */
export function AsyncBoundary<T>({
  query,
  children,
  empty,
  isEmpty,
  skeleton,
}: AsyncBoundaryProps<T>) {
  if (query.isPending) {
    return <>{skeleton ?? <DefaultSkeleton />}</>;
  }
  if (query.isError) {
    return <QueryErrorState error={query.error} retry={() => query.refetch()} />;
  }
  if (isEmpty?.(query.data)) {
    return (
      <EmptyState
        icon={empty?.icon}
        title={empty?.title ?? "Nothing here yet"}
        description={empty?.description}
      />
    );
  }
  return <>{children(query.data)}</>;
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function QueryErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (error instanceof ApiError) {
      if (error.code === "PROFILE_INCOMPLETE") router.replace("/profile/setup");
      if (error.code === "PASSWORD_CHANGE_REQUIRED") router.replace("/change-password");
    }
  }, [error, router]);

  if (
    error instanceof ApiError &&
    (error.code === "PROFILE_INCOMPLETE" || error.code === "PASSWORD_CHANGE_REQUIRED")
  ) {
    return <DefaultSkeleton />;
  }

  const message =
    error instanceof Error ? error.message : "Something went wrong. Please try again.";
  const forbidden = error instanceof ApiError && error.status === 403;
  return (
    <EmptyState
      title={forbidden ? "Access denied" : "Couldn't load this content"}
      description={forbidden ? "You do not have permission to view this content." : message}
      action={
        <Button variant="outline" size="sm" onClick={retry}>
          <RefreshCwIcon /> Retry
        </Button>
      }
    />
  );
}
