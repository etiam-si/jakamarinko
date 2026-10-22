import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { env } from "./src/env";

const root = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  // Runs as a long-lived Node server in Docker, not serverless.
  output: "standalone",
  outputFileTracingRoot: root,
  turbopack: { root },
  transpilePackages: ["@jakamarinko/api", "@jakamarinko/types"],
  // Local dev only: on the server Traefik sends /api/* to the api container before it reaches Next.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${env.API_URL}/api/:path*` }];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
