import { StrictMode, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/providers";
import { useSessionBootstrap } from "@/components/auth/use-session-bootstrap";
import { changePassword, getMe, refreshSession } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getMyProfile, initializeMyProfile, updateMyProfile, type ProfileView } from "@/lib/api/members";
import { SessionStore, sessionStore } from "@/lib/auth/session-store";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import ProfileSetupPage from "@/pages/ProfileSetupPage";

vi.mock("@/lib/api/auth", () => ({
  changePassword: vi.fn(), getMe: vi.fn(), refreshSession: vi.fn(),
}));
vi.mock("@/lib/api/members", () => ({
  getMyProfile: vi.fn(), initializeMyProfile: vi.fn(), updateMyProfile: vi.fn(),
}));
vi.mock("@/components/theme", () => ({ ThemeProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("sonner", () => ({ Toaster: () => null, toast: { success: vi.fn(), error: vi.fn() } }));

const user = {
  id: 1, username: "member", roll_number: "M001", must_change_password: false, role_assignments: [],
};
const profile: ProfileView = {
  user_id: 1, roll_number: "M001", username: "member", real_name: "Member", year: 2,
  branch: "CSE", about: "About member", skills: ["React"], interests: "", hobbies: "",
  github_url: null, linkedin_url: null, leetcode_url: null, codechef_url: null,
  codeforces_url: null, hackerrank_url: null, is_complete: false, created_at: null, club_role: null,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

let client: QueryClient;
let freshStore: SessionStore;
let generationBase = 0;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request"); }));
  freshStore = new SessionStore();
  for (const method of [
    "getSnapshot", "getGeneration", "isCurrentGeneration", "canBootstrap", "subscribe",
    "setSession", "setAccessToken", "clearSession", "hasCapability",
  ] as const) {
    vi.spyOn(sessionStore, method).mockImplementation(freshStore[method].bind(freshStore));
  }
  generationBase += 100;
  const base = generationBase;
  vi.mocked(sessionStore.getGeneration).mockImplementation(() => base + freshStore.getGeneration());
  vi.mocked(sessionStore.isCurrentGeneration).mockImplementation((value) =>
    freshStore.isCurrentGeneration(value - base),
  );
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  vi.mocked(getMe).mockResolvedValue(user);
  vi.mocked(refreshSession).mockResolvedValue({ access_token: "refreshed", token_type: "Bearer" });
  vi.mocked(getMyProfile).mockResolvedValue(profile);
  vi.mocked(initializeMyProfile).mockResolvedValue(profile);
  vi.mocked(updateMyProfile).mockResolvedValue({ ...profile, is_complete: true });
  vi.mocked(changePassword).mockResolvedValue({ message: "Updated" });
});

afterEach(() => {
  cleanup();
  client.clear();
  expect(fetch).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderPage(page: ReactNode) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/test"]}>
        <Routes>
          <Route path="/test" element={page} />
          <Route path="/login" element={<div>Login destination</div>} />
          <Route path="/dashboard" element={<div>Dashboard destination</div>} />
          <Route path="/change-password" element={<div>Password destination</div>} />
          <Route path="/profile/setup" element={<div>Profile destination</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function tokenSession() {
  sessionStore.setAccessToken("existing");
}

function signedIn(mustChange = false) {
  sessionStore.setSession({ ...user, must_change_password: mustChange }, "existing");
}

function submitPassword() {
  fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "temporary" } });
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password" } });
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "new-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
}

describe("session generation", () => {
  it("distinguishes a new page from clear and preserves refresh generation", () => {
    expect(freshStore.canBootstrap()).toBe(true);
    const initial = freshStore.getGeneration();
    freshStore.setAccessToken("token");
    expect(freshStore.isCurrentGeneration(initial)).toBe(true);
    freshStore.setSession(user, "token");
    expect(freshStore.isCurrentGeneration(initial)).toBe(false);
    const authenticated = freshStore.getGeneration();
    freshStore.clearSession();
    expect(freshStore.isCurrentGeneration(authenticated)).toBe(false);
    expect(freshStore.canBootstrap()).toBe(false);
    const cleared = freshStore.getSnapshot();
    freshStore.clearSession();
    expect(freshStore.getSnapshot()).not.toBe(cleared);
    expect(freshStore.getSnapshot()).toEqual({ accessToken: null, user: null });
  });
});

describe("bootstrap lifecycle", () => {
  it("single-flights genuine initial refresh, then never reuses ready after clear or remount", async () => {
    const view = renderHook(() => [useSessionBootstrap(), useSessionBootstrap()], {
      wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
    });
    await waitFor(() => expect(view.result.current.map((item) => item.status)).toEqual(["ready", "ready"]));
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(getMe).toHaveBeenCalledTimes(1);
    act(() => sessionStore.clearSession());
    expect(view.result.current[0].status).toBe("signed-out");
    act(() => view.result.current[0].retry());
    view.unmount();
    const remount = renderHook(useSessionBootstrap);
    expect(remount.result.current.status).toBe("signed-out");
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it("does not restore a token from refresh completing after clear", async () => {
    const pending = deferred<Awaited<ReturnType<typeof refreshSession>>>();
    vi.mocked(refreshSession).mockReturnValue(pending.promise);
    const view = renderHook(useSessionBootstrap);
    act(() => sessionStore.clearSession());
    await act(async () => pending.resolve({ access_token: "stale", token_type: "Bearer" }));
    expect(view.result.current.status).toBe("signed-out");
    expect(sessionStore.getSnapshot().accessToken).toBeNull();
    expect(getMe).not.toHaveBeenCalled();
  });

  it.each(["clear", "replace"])("ignores getMe completing after session %s", async (action) => {
    tokenSession();
    const pending = deferred<typeof user>();
    vi.mocked(getMe).mockReturnValue(pending.promise);
    const view = renderHook(useSessionBootstrap);
    act(() => {
      sessionStore.clearSession();
      if (action === "replace") sessionStore.setSession({ ...user, id: 2 }, "new-session");
    });
    await act(async () => pending.resolve(user));
    expect(sessionStore.getSnapshot().user?.id).toBe(action === "replace" ? 2 : undefined);
    expect(view.result.current.status).toBe(action === "replace" ? "ready" : "signed-out");
  });

  it("preserves a newer session when an old bootstrap rejects", async () => {
    tokenSession();
    const pending = deferred<typeof user>();
    vi.mocked(getMe).mockReturnValue(pending.promise);
    const view = renderHook(useSessionBootstrap);
    act(() => sessionStore.setSession({ ...user, id: 2 }, "new-session"));
    await act(async () => pending.reject(new ApiError(401, "UNAUTHORIZED", "Expired")));
    expect(sessionStore.getSnapshot().user?.id).toBe(2);
    expect(view.result.current.status).toBe("ready");
  });

  it("uses the latest rotated token when bootstrap resolves the user", async () => {
    tokenSession();
    const pending = deferred<typeof user>();
    vi.mocked(getMe).mockReturnValue(pending.promise);
    const view = renderHook(useSessionBootstrap);
    act(() => sessionStore.setAccessToken("rotated"));
    await act(async () => pending.resolve(user));
    expect(view.result.current.status).toBe("ready");
    expect(sessionStore.getSnapshot().accessToken).toBe("rotated");
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("treats a rejected refresh as signed out without automatic reauthentication", async () => {
    vi.mocked(refreshSession).mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Expired"));
    const view = renderHook(useSessionBootstrap);
    await waitFor(() => expect(view.result.current.status).toBe("signed-out"));
    act(() => view.result.current.retry());
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(sessionStore.canBootstrap()).toBe(false);
  });

  it("detects password-required on an already cached user", () => {
    signedIn(true);
    const view = renderHook(useSessionBootstrap);
    expect(view.result.current.status).toBe("password-change-required");
    expect(getMe).not.toHaveBeenCalled();
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it.each(["PASSWORD_CHANGE_REQUIRED", "PROFILE_INCOMPLETE"])("handles %s from the server", async (code) => {
    tokenSession();
    vi.mocked(getMe).mockRejectedValue(new ApiError(403, code, "Onboarding required"));
    const view = renderHook(useSessionBootstrap);
    await waitFor(() => expect(view.result.current.status).toBe(
      code === "PASSWORD_CHANGE_REQUIRED" ? "password-change-required" : "profile-incomplete",
    ));
  });
});

describe("onboarding lifecycle", () => {
  it.each([
    ["profile", ProfileSetupPage], ["password", ChangePasswordPage],
  ] as const)("renders session errors and retries instead of a disabled-query splash: %s", async (_name, Page) => {
    tokenSession();
    vi.mocked(getMe).mockRejectedValueOnce(new Error("Session unavailable"));
    renderPage(<Page />);
    expect(await screen.findByText("Session unavailable")).toBeInTheDocument();
    expect(getMyProfile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(sessionStore.getSnapshot().user).toEqual(user));
  });

  it("initializes a missing profile once, shows initialization errors, and retries only explicitly", async () => {
    signedIn();
    vi.mocked(getMyProfile).mockRejectedValue(new ApiError(404, "NOT_FOUND", "Missing profile"));
    vi.mocked(initializeMyProfile).mockRejectedValueOnce(new Error("Initialization failed"));
    const view = renderPage(<ProfileSetupPage />);
    expect(await screen.findByText("Initialization failed")).toBeInTheDocument();
    view.rerender(
      <QueryClientProvider client={client}><MemoryRouter><ProfileSetupPage /></MemoryRouter></QueryClientProvider>,
    );
    expect(initializeMyProfile).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("button", { name: "Save profile" })).toBeInTheDocument();
    expect(initializeMyProfile).toHaveBeenCalledTimes(2);
    expect(client.getQueryData(["profile", "me"])).toEqual(profile);
  });

  it("updates the profile cache before waiting for user resync and navigating", async () => {
    signedIn();
    const pending = deferred<typeof user>();
    vi.mocked(getMe).mockReturnValue(pending.promise);
    renderPage(<ProfileSetupPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(getMe).toHaveBeenCalledTimes(1));
    expect(client.getQueryData(["profile", "me"])).toEqual({ ...profile, is_complete: true });
    expect(screen.queryByText("Dashboard destination")).not.toBeInTheDocument();
    await act(async () => pending.resolve(user));
    expect(await screen.findByText("Dashboard destination")).toBeInTheDocument();
  });

  it("renders profile resync failure after saving and allows retry", async () => {
    signedIn();
    vi.mocked(getMe).mockRejectedValueOnce(new Error("Resync failed"));
    renderPage(<ProfileSetupPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Resync failed")).toBeInTheDocument();
    expect(client.getQueryData(["profile", "me"])).toEqual({ ...profile, is_complete: true });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Dashboard destination")).toBeInTheDocument();
  });

  it("does not cache a stale profile save after signout", async () => {
    signedIn();
    const pending = deferred<ProfileView>();
    vi.mocked(updateMyProfile).mockReturnValue(pending.promise);
    renderPage(<ProfileSetupPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledTimes(1));
    act(() => {
      sessionStore.clearSession();
      client.clear();
    });
    await act(async () => pending.resolve({ ...profile, is_complete: true }));
    expect(client.getQueryData(["profile", "me"])).toBeUndefined();
    expect(getMe).not.toHaveBeenCalled();
  });

  it("does not restore a cleared session when profile resync completes", async () => {
    signedIn();
    const pending = deferred<typeof user>();
    vi.mocked(getMe).mockReturnValue(pending.promise);
    renderPage(<ProfileSetupPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(getMe).toHaveBeenCalledTimes(1));
    act(() => sessionStore.clearSession());
    await act(async () => pending.resolve(user));
    expect(sessionStore.getSnapshot().user).toBeNull();
    expect(await screen.findByText("Login destination")).toBeInTheDocument();
  });

  it("renders required-password UI and clears session after a successful change", async () => {
    signedIn(true);
    renderPage(<ChangePasswordPage />);
    expect(screen.getByText("Set a new password")).toBeInTheDocument();
    submitPassword();
    expect(await screen.findByText("Login destination")).toBeInTheDocument();
    expect(sessionStore.canBootstrap()).toBe(false);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("does not clear a newer session after a stale password-change response", async () => {
    signedIn(true);
    const pending = deferred<{ message: string }>();
    vi.mocked(changePassword).mockReturnValue(pending.promise);
    renderPage(<ChangePasswordPage />);
    submitPassword();
    await waitFor(() => expect(changePassword).toHaveBeenCalledTimes(1));
    act(() => sessionStore.setSession({ ...user, id: 2 }, "new-session"));
    await act(async () => pending.resolve({ message: "Updated" }));
    expect(sessionStore.getSnapshot().user?.id).toBe(2);
  });
});

it("clears provider caches on signout and account replacement, not token rotation", () => {
  signedIn();
  let providedClient!: QueryClient;
  function Capture() {
    providedClient = useQueryClient();
    return null;
  }
  render(<Providers><Capture /></Providers>);
  providedClient.setQueryData(["private"], "first");
  act(() => sessionStore.setAccessToken("rotated"));
  expect(providedClient.getQueryData(["private"])).toBe("first");
  act(() => sessionStore.setSession({ ...user, id: 2 }, "second"));
  expect(providedClient.getQueryData(["private"])).toBeUndefined();
  providedClient.setQueryData(["private"], "second");
  act(() => sessionStore.clearSession());
  expect(providedClient.getQueryData(["private"])).toBeUndefined();
});
