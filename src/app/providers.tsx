"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { sessionStore, type SessionStore } from "@/lib/auth/session-store";

const SessionStoreContext = createContext<SessionStore>(sessionStore);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionStoreContext.Provider value={sessionStore}>
      {children}
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
