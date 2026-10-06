import { fileURLToPath } from "node:url";
import type { IncomingMessage } from "node:http";
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget =
    env.VITE_BACKEND_ORIGIN?.trim() || "http://127.0.0.1:5000";

  const proxy = Object.fromEntries(
    BACKEND_PREFIXES.map((prefix) => [
      `/${prefix}`,
      {
        target: backendTarget,
        changeOrigin: true,
        bypass: (req: IncomingMessage) => req.headers["x-cms-api"] === "1" ? undefined : req.url,
      },
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
  };
});
