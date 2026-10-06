import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { QueryState } from "@/components/ui/async";
import { ApiError } from "@/lib/api/errors";

const clients: QueryClient[] = [];
afterEach(() => { cleanup(); clients.forEach((client) => client.clear()); clients.length = 0; });

function mount(queryFn: () => Promise<string[]>, initialData?: string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  clients.push(client);
  function Screen() {
    const query = useQuery({ queryKey: ["test"], queryFn, initialData });
    return <QueryState query={query} notFound="Member not found" isEmpty={(items) => items.length === 0} empty={{ title: "No items" }}>
      {(items) => <p>{items.join(", ")}</p>}
    </QueryState>;
  }
  render(<QueryClientProvider client={client}><MemoryRouter><Routes>
    <Route path="/" element={<Screen />} />
    <Route path="/profile/setup" element={<p>Profile gate</p>} />
    <Route path="/change-password" element={<p>Password gate</p>} />
    <Route path="/login" element={<p>Login page</p>} />
  </Routes></MemoryRouter></QueryClientProvider>);
  return client;
}

it.each([
  [new ApiError(404, "NOT_FOUND", "missing"), "Member not found"],
  [new ApiError(403, "FORBIDDEN", "denied"), "Access denied"],
  [new ApiError(500, "INTERNAL_ERROR", "unavailable"), "Couldn't load this content"],
  [new TypeError("Failed to fetch"), "Connection problem"],
])("distinguishes initial failures: %s", async (error, title) => {
  mount(() => Promise.reject(error));
  expect(await screen.findByText(title)).toBeInTheDocument();
  expect(screen.queryByText("No items")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("announces default loading with visually hidden text and removes the status after success", async () => {
  let resolve: (items: string[]) => void = () => {};
  mount(() => new Promise<string[]>((done) => { resolve = done; }));

  const status = screen.getByRole("status", { name: "Loading content…" });
  const label = screen.getByText("Loading content…");
  expect(label).toHaveClass("sr-only");
  expect(label.id).not.toBe("");
  expect(status).toHaveAttribute("aria-labelledby", label.id);
  expect(status).toHaveClass("flex", "flex-col", "gap-3");
  const skeletons = status.querySelectorAll(".animate-pulse");
  expect(skeletons).toHaveLength(3);
  expect(skeletons[0]).toHaveClass("h-24", "w-full");
  expect(skeletons[1]).toHaveClass("h-40", "w-full");
  expect(skeletons[2]).toHaveClass("h-40", "w-full");
  for (const skeleton of skeletons) expect(skeleton).toHaveAttribute("aria-hidden", "true");

  await act(async () => { resolve(["loaded"]); });
  expect(await screen.findByText("loaded")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("preserves a custom skeleton without adding a default loading status", () => {
  render(
    <QueryState<string[]>
      query={{ data: undefined, isPending: true, isError: false, error: null, refetch: vi.fn() }}
      skeleton={<p role="status">Loading members</p>}
    >
      {(items) => <p>{items.join(", ")}</p>}
    </QueryState>,
  );
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status")).toHaveTextContent("Loading members");
  expect(screen.queryByText("Loading content…")).not.toBeInTheDocument();
});

it("gives simultaneous default loading statuses unique labels", () => {
  const query = { data: undefined, isPending: true, isError: false, error: null, refetch: vi.fn() };
  render(
    <>
      <QueryState query={query}>{() => <p>First result</p>}</QueryState>
      <QueryState query={query}>{() => <p>Second result</p>}</QueryState>
    </>,
  );
  const statuses = screen.getAllByRole("status", { name: "Loading content…" });
  expect(statuses).toHaveLength(2);
  expect(statuses[0].getAttribute("aria-labelledby")).not.toBe(statuses[1].getAttribute("aria-labelledby"));
});

it("does not announce loading when cached data is available", () => {
  mount(() => new Promise<string[]>(() => {}), ["cached"]);
  expect(screen.getByText("cached")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("keeps cached data on refetch failure and retries successfully", async () => {
  const queryFn = vi.fn<() => Promise<string[]>>().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(["fresh"]);
  const client = mount(queryFn, ["cached"]);
  await act(async () => { await client.refetchQueries({ queryKey: ["test"] }); });
  expect(await screen.findByText("Couldn't refresh this content")).toBeInTheDocument();
  expect(screen.getByText("cached")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("fresh")).toBeInTheDocument();
  expect(screen.queryByText("Couldn't refresh this content")).not.toBeInTheDocument();
});

it("keeps cached empty results with a refresh warning", async () => {
  const client = mount(() => Promise.reject(new Error("offline")), []);
  await act(async () => { await client.refetchQueries({ queryKey: ["test"] }); });
  expect(await screen.findByText("Couldn't refresh this content")).toBeInTheDocument();
  expect(screen.getByText("No items")).toBeInTheDocument();
});

it.each([
  ["PROFILE_INCOMPLETE", "Profile gate"],
  ["PASSWORD_CHANGE_REQUIRED", "Password gate"],
])("honors %s even with cached data", async (code, destination) => {
  const client = mount(() => Promise.reject(new ApiError(403, code, "gate")), ["private"]);
  await act(async () => { await client.refetchQueries({ queryKey: ["test"] }); });
  expect(await screen.findByText(destination)).toBeInTheDocument();
  expect(screen.queryByText("private")).not.toBeInTheDocument();
});

it("hides cached data after permission loss", async () => {
  const client = mount(() => Promise.reject(new ApiError(403, "FORBIDDEN", "denied")), ["private"]);
  await act(async () => { await client.refetchQueries({ queryKey: ["test"] }); });
  expect(await screen.findByText("Access denied")).toBeInTheDocument();
  expect(screen.queryByText("private")).not.toBeInTheDocument();
});
