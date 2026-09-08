import type { NextConfig } from "next";

// Same-origin proxy for the Flask backend. The refresh cookie is
// Secure/HttpOnly/SameSite=Lax and scoped to /auth, so the browser must talk
// to the backend through this origin.
//
// API requests are recognized by the X-CMS-API header set in the fetch client
// and rewritten before filesystem routes; without it, matching paths such as
// /admin/sigs or /members/<roll_number> are served as app pages.
const backendOrigin = process.env.BACKEND_ORIGIN?.trim();

if (!backendOrigin) {
  throw new Error("BACKEND_ORIGIN must be set to the backend origin.");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        "auth",
        "members",
        "admin",
        "learning",
        "documentation",
        "projects",
        "operations",
        "health",
      ].map((prefix) => ({
        source: `/${prefix}/:path*`,
        has: [{ type: "header" as const, key: "x-cms-api" }],
        destination: `${backendOrigin}/${prefix}/:path*`,
      })),
    };
  },
};

export default nextConfig;
