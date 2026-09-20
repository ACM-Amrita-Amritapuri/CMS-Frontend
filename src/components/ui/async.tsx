import { useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import type { UseQueryResult } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { RefreshCwIcon } from "lucide-react";

interface QueryStateProps<T> {
  query: Pick<UseQueryResult<T>, "data" | "isPending" | "isError" | "error" | "refetch">;
  children: (data: T) => React.ReactNode;
  empty?: {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  notFound?: string;
  isEmpty?: (data: T) => boolean;
  skeleton?: React.ReactNode;
}

export function QueryState<T>({
  query,
  children,
  empty,
  notFound,
  isEmpty,
  skeleton,
}: QueryStateProps<T>) {
  if (query.data === undefined) {
    if (query.isError) {
      return <QueryErrorState error={query.error} retry={() => query.refetch()} notFound={notFound} />;
    }
    return <>{skeleton ?? <DefaultSkeleton />}</>;
  }
  const accessError = query.error instanceof ApiError && [401, 403].includes(query.error.status);
  if (query.isError && accessError) {
    return <QueryErrorState error={query.error} retry={() => query.refetch()} notFound={notFound} />;
  }
  const isEmptyResult = isEmpty?.(query.data) ?? false;
  return (
    <>
      {query.isError && !isEmptyResult ? (
        <QueryErrorState error={query.error} retry={() => query.refetch()} cached />
      ) : null}
      {isEmptyResult ? (
        <EmptyState
          icon={empty?.icon}
          title={empty?.title ?? "Nothing here yet"}
          description={empty?.description}
        />
      ) : children(query.data)}
    </>
  );
}

export const AsyncBoundary = QueryState;

function DefaultSkeleton() {
  const labelId = useId();

  return (
    <div role="status" aria-labelledby={labelId} className="flex flex-col gap-3">
      <span id={labelId} className="sr-only">Loading content…</span>
      <Skeleton aria-hidden="true" className="h-24 w-full" />
      <Skeleton aria-hidden="true" className="h-40 w-full" />
      <Skeleton aria-hidden="true" className="h-40 w-full" />
    </div>
  );
}

export function QueryErrorState({
  error,
  retry,
  notFound = "Content not found",
  cached = false,
}: {
  error: unknown;
  retry: () => void;
  notFound?: string;
  cached?: boolean;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (error instanceof ApiError) {
      if (error.code === "PROFILE_INCOMPLETE") navigate("/profile/setup", { replace: true });
      if (error.code === "PASSWORD_CHANGE_REQUIRED")
        navigate("/change-password", { replace: true });
    }
  }, [error, navigate]);

  if (
    error instanceof ApiError &&
    (error.code === "PROFILE_INCOMPLETE" || error.code === "PASSWORD_CHANGE_REQUIRED")
  ) {
    return <DefaultSkeleton />;
  }

  const status = error instanceof ApiError ? error.status : undefined;
  const title = cached ? "Couldn't refresh this content" :
    status === 401 ? "Sign in required" :
    status === 403 ? "Access denied" :
    status === 404 ? notFound :
    error instanceof TypeError ? "Connection problem" : "Couldn't load this content";
  const description = cached ? "Showing previously loaded data. Try again to get the latest changes." :
    status === 401 ? "Your session has expired. Sign in again to continue." :
    status === 403 ? "You do not have permission to view this content." :
    status === 404 ? "The requested content does not exist or is no longer available." :
    error instanceof TypeError ? "Check your connection and try again." :
    error instanceof Error ? error.message : "The request failed. Please try again.";
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        <Button variant="outline" size="sm" onClick={status === 401 ? () => navigate("/login") : retry}>
          <RefreshCwIcon /> {status === 401 ? "Sign in" : "Retry"}
        </Button>
      }
    />
  );
}
