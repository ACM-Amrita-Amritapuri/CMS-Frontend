import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/components/theme";
import { sessionStore, type SessionStore } from "@/lib/auth/session-store";
import { ApiError } from "@/lib/api/errors";

const SessionStoreContext = createContext<SessionStore>(sessionStore);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The API client owns 401 refresh handling; blanket retries only
            // delay visible error states, so they are off.
            retry: (failureCount, error) =>
              failureCount < 2 && (!(error instanceof ApiError) || error.status >= 500),
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  useEffect(() => {
    let previousUserId = sessionStore.getSnapshot().user?.id;
    const synchronize = () => {
      const { accessToken, user } = sessionStore.getSnapshot();
      if (previousUserId !== undefined && user?.id !== undefined && previousUserId !== user.id) {
        queryClient.clear();
      } else if (!accessToken && sessionStore.getClearReason() === "signout") {
        queryClient.clear();
      } else if (!accessToken) {
        void queryClient.cancelQueries().finally(() => queryClient.removeQueries());
      }
      previousUserId = user?.id;
    };
    const unsubscribe = sessionStore.subscribe(synchronize);
    synchronize();
    return unsubscribe;
  }, [queryClient]);

  return (
    <SessionStoreContext.Provider value={sessionStore}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionStoreContext.Provider>
  );
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster position="top-center" richColors closeButton theme={resolvedTheme} />;
}

export function useSession() {
  const store = useContext(SessionStoreContext);
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const hasCapability = store.hasCapability;

  return useMemo(
    () => ({ ...state, generation: store.getGeneration(), hasCapability }),
    [state, store, hasCapability],
  );
}
