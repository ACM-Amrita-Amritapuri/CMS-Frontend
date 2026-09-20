import { Link } from "react-router-dom";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  useDocumentTitle("Not found");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <p className="text-muted-foreground mb-4 text-sm font-semibold tracking-widest">404</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Page not found</h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        The page you are looking for doesn&apos;t exist.
      </p>
      <Button asChild variant="outline" className="mt-6 min-h-11 w-full max-w-xs sm:w-auto">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
