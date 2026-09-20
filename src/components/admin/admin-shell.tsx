import { type ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full min-w-0 py-2 text-card-foreground sm:p-4 lg:p-6">
      {children}
    </div>
  );
}
