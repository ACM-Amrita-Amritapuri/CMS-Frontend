import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe, refreshSession } from "@/lib/api/auth";
import { sessionStore } from "@/lib/auth/session-store";
import { useSessionBootstrap } from "@/components/auth/use-session-bootstrap";

vi.mock("@/lib/api/auth", () => ({
  getMe: vi.fn(),
  refreshSession: vi.fn(),
}));

const user = {
  id: 1,
  username: "member",
  roll_number: "A1",
  must_change_password: false,
  role_assignments: [],
};

describe("useSessionBootstrap", () => {
  beforeEach(() => {
    sessionStore.clearSession();
    vi.mocked(refreshSession).mockResolvedValue({ access_token: "access-token", token_type: "Bearer" });
    vi.mocked(getMe).mockResolvedValue(user);
  });

  it("reports signed out when a ready session is cleared", async () => {
    const { result } = renderHook(() => useSessionBootstrap());

    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => sessionStore.clearSession());

    expect(result.current.status).toBe("signed-out");
  });
});
