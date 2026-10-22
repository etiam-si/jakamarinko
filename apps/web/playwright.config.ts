import { defineConfig, devices } from "@playwright/test";

// Ports and database come from .env.local (scripts/worktree-env.sh), loaded by `pnpm e2e` at the root.
// Without it: the defaults below and the shared dev Postgres from dev/compose.yml.
const webPort = process.env.WEB_PORT ?? "3000";
const apiPort = process.env.API_PORT ?? "3001";
const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54320/postgres";
const env = { WEB_PORT: webPort, API_PORT: apiPort, API_URL: `http://localhost:${apiPort}`, DATABASE_URL: databaseUrl };
// Readiness checks go to ::1: on WSL (mirrored networking) a connect to a closed 127.0.0.1 port hangs for minutes.
const ready = (port: string, path: string) => `http://[::1]:${port}${path}`;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${webPort}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // `pnpm e2e` builds first (turbo), so web runs the production build.
  webServer: [
    {
      command: "pnpm --dir ../api start",
      url: ready(apiPort, "/api/health"),
      env,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm start",
      url: ready(webPort, "/en"),
      env,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
