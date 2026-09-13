import { type ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full rounded-xl bg-[#0a0a0a] p-5 ring-1 ring-[#1f1f1f] md:p-8">
      {children}
    </div>
  );
}
