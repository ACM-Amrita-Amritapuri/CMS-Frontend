import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme";
import { sessionStore, type SessionStore } from "@/lib/auth/session-store";

const SessionStoreContext = createContext<SessionStore>(sessionStore);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The API client owns 401 refresh handling; blanket retries only
            // delay visible error states, so they are off.
            retry: false,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    let previousUserId = sessionStore.getSnapshot().user?.id;
    const synchronize = () => {
      const { accessToken, user } = sessionStore.getSnapshot();
      if (!accessToken || (previousUserId !== undefined && previousUserId !== user?.id)) {
        queryClient.clear();
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
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionStoreContext.Provider>
  );
}

export function useSession() {
  const store = useContext(SessionStoreContext);
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  return {
    ...state,
    generation: store.getGeneration(),
    hasCapability: store.hasCapability.bind(store),
  };
}
