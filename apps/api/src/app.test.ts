import { expect, test, vi } from "vitest";
import { app } from "./app";

vi.mock("./db", () => ({ db: () => ({ execute: async () => ({ rows: [] }) }) }));

test("GET /api/health", async () => {
  const res = await app.request("/api/health");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true, service: "api" });
});
