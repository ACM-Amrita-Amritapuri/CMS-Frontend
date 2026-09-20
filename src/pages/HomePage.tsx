import { Navigate } from "react-router-dom";

import { SessionGate } from "@/components/auth/session-gate";

export default function HomePage() {
  return (
    <SessionGate>
      <Navigate to="/dashboard" replace />
    </SessionGate>
  );
}
