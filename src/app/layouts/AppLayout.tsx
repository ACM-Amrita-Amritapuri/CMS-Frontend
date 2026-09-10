import { Outlet } from "react-router-dom";
import { SessionGate } from "@/components/auth/session-gate";
import { AppShell } from "@/components/layout/app-shell";

export function AppLayout() {
  return (
    <SessionGate>
      <AppShell>
        <Outlet />
      </AppShell>
    </SessionGate>
  );
}
