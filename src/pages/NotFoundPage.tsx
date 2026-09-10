import { Link } from "react-router-dom";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Not found");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground text-sm">
        The page you are looking for doesn&apos;t exist.
      </p>
      <Link to="/dashboard" className="text-sm font-medium hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
