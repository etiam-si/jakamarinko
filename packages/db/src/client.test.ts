import { afterEach, expect, test, vi } from "vitest";
import { db } from "./client";
import { runMigrations } from "./migrate";

afterEach(() => vi.unstubAllEnvs());

test("db() needs DATABASE_URL", () => {
  vi.stubEnv("DATABASE_URL", "");
  expect(() => db()).toThrow("DATABASE_URL is not set");
});

test("runMigrations() skips a folder without migrations", async () => {
  expect(await runMigrations("/nonexistent")).toBe(false);
});
