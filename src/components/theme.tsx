import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "cms-theme";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function isDark(theme: Theme) {
  return (
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", isDark(theme));
}

const ThemeContext = createContext<{
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}>({ theme: "system", resolvedTheme: "dark", setTheme: () => undefined });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readTheme,
    () => "system" as Theme,
  );

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    listeners.forEach((listener) => listener());
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: (isDark(theme) ? "dark" : "light") as "dark" | "light",
      setTheme,
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
