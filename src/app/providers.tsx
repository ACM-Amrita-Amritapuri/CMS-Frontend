"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useSyncExternalStore, createContext, useContext } from "react";
import { TooltipProvider } from "@/components/ui/primitives";
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

  return (
    <SessionStoreContext.Provider value={sessionStore}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </TooltipProvider>
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
    hasCapability: store.hasCapability.bind(store),
  };
}
