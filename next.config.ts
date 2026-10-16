import type { NextConfig } from "next";

/**
 * Base URL of the FastAPI backend (server-side only).
 * The browser never talks to it directly: every call goes to `/api/*` on this
 * origin and is rewritten here, so the backend session cookie stays first-party.
 */
const API_URL = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
