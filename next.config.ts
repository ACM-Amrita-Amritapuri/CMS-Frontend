import type { NextConfig } from "next";

// Same-origin proxy for the Flask backend. The refresh cookie is
// Secure/HttpOnly/SameSite=Lax and scoped to /auth, so the browser must talk
// to the backend through this origin. In production a reverse proxy (or
// NEXT_PUBLIC_API_BASE_URL with matching CORS/cookie config) serves the same
// purpose.
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
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
      destination: `${backendOrigin}/${prefix}/:path*`,
    }));
  },
};

export default nextConfig;
