import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next 15 passes removed ESLint options during its build-time adapter under Bun.
  // The standalone `bun run lint` command remains the required lint gate.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
