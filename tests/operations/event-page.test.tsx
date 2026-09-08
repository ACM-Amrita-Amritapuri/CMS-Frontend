import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const { event } = vi.hoisted(() => ({
  event: {
    id: 42,
    title: "Demo event",
    description: "A test event",
    starts_at: "2026-09-08T10:00:00",
    ends_at: "2026-09-08T11:00:00",
    location: "Lab 3",
    capacity: 40,
    state: "PUBLISHED" as const,
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/providers", () => ({
  useSession: () => ({ hasCapability: () => false }),
}));

vi.mock("@/lib/api/club-operations", () => ({
  cancelEvent: vi.fn(),
  getEvent: vi.fn().mockResolvedValue(event),
  publishEvent: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import EventPage from "@/app/(app)/operations/events/[eventId]/page";

describe("EventPage", () => {
  it("renders an event detail without an update-depth loop", async () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval").mockReturnValue(0 as never);
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval").mockImplementation(() => undefined);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const params = {
      then: () => undefined,
      status: "fulfilled",
      value: { eventId: String(event.id) },
    } as unknown as Promise<{ eventId: string }>;

    try {
      render(
        <QueryClientProvider client={queryClient}>
          <EventPage params={params} />
        </QueryClientProvider>,
      );

      expect(await screen.findByRole("heading", { name: event.title })).toBeInTheDocument();
    } finally {
      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    }
  });
});
