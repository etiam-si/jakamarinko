import path from "node:path";
import type { NextConfig } from "next";

const root = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  // Runs as a long-lived Node server in Docker, not serverless.
  output: "standalone",
  outputFileTracingRoot: root,
  turbopack: { root },
  transpilePackages: ["@jakamarinko/shared"],
  // Local dev only: on the server Traefik sends /api/* to the api container before it reaches Next.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_URL ?? "http://localhost:3001"}/api/:path*` }];
  },
};

export default nextConfig;
