import { expect, expectTypeOf, test, vi } from "vitest";
import { createApiClient } from "./client";
import type { Health } from "./health";

test("the client calls /api routes with the api's types", async () => {
  const fetch = vi.fn(async (_input: string | URL | Request) => Response.json({ ok: true, service: "api" }));
  const api = createApiClient("https://jakamarinko.com", { fetch });

  const res = await api.health.$get();

  expect(String(fetch.mock.calls[0]![0])).toBe("https://jakamarinko.com/api/health");
  expectTypeOf(await res.json()).toEqualTypeOf<Health>();
});
