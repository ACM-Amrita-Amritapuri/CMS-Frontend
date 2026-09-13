import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND_PREFIXES = [
  "auth",
  "members",
  "admin",
  "learning",
  "documentation",
  "projects",
  "operations",
  "health",
] as const;

function manualChunks(id: string) {
  const normalizedId = id.replaceAll("\\", "/");
  if (!normalizedId.includes("/node_modules/")) return undefined;
  if (
    normalizedId.includes("/node_modules/react/") ||
    normalizedId.includes("/node_modules/react-dom/") ||
    normalizedId.includes("/node_modules/scheduler/")
  ) {
    return "react-vendor";
  }
  if (normalizedId.includes("/react-router")) return "router-vendor";
  if (normalizedId.includes("/tailwind-merge/")) return "tailwind-vendor";
  if (normalizedId.includes("/sonner/")) return "notifications-vendor";
  if (normalizedId.includes("/node_modules/@tanstack/")) return "query-vendor";
  if (
    normalizedId.includes("/node_modules/@radix-ui/") ||
    normalizedId.includes("/node_modules/@floating-ui/") ||
    normalizedId.includes("/cmdk/")
  ) {
    return "ui-vendor";
  }
  return "vendor";
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget =
    env.VITE_BACKEND_ORIGIN?.trim() || "http://127.0.0.1:5000";

  const proxy = Object.fromEntries(
    BACKEND_PREFIXES.map((prefix) => [
      `/${prefix}`,
      { target: backendTarget, changeOrigin: true },
    ]),
  );

  return {
    plugins: [react()],
    base: mode === "production" ? "/cms/" : "/",
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  };
});
