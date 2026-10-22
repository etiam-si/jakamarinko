import { defineConfig } from "vitest/config";

// Each test file builds an in-memory Postgres with every migration in beforeAll. With all packages testing at once on
// CI's 2 cores that takes longer than vitest's default 10 s, so setup hooks get a minute.
export default defineConfig({ test: { hookTimeout: 60_000 } });
