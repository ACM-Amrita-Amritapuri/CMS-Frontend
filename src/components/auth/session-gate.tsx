import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCwIcon } from "lucide-react";

import { useSessionBootstrap } from "@/components/auth/use-session-bootstrap";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";

function Splash() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <div className="bg-primary/15 text-primary flex size-12 animate-pulse items-center justify-center rounded-2xl font-bold text-lg">
        A
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/**
 * Guards the authenticated workspace. The access token lives in memory, so
 * the decision is made client-side after cookie-based bootstrap; the backend
 * stays the authorization authority on every request.
 */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { status, error, retry } = useSessionBootstrap();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "signed-out") navigate("/login", { replace: true });
    if (status === "password-change-required")
      navigate("/change-password", { replace: true });
    if (status === "profile-incomplete")
      navigate("/profile/setup", { replace: true });
  }, [status, navigate]);

  if (status === "ready") return <>{children}</>;
  if (status === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-medium">Could not reach the server.</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          {error instanceof Error ? error.message : "An unexpected error occurred."}
        </p>
        <Button variant="outline" size="sm" onClick={retry}>
          <RefreshCwIcon /> Try again
        </Button>
      </div>
    );
  }
  return <Splash />;
}
