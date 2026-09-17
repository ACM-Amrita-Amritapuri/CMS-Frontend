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
