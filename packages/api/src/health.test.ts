import { expect, test } from "vitest";
import { ApiErrorBody, Health } from "./index";

test("contracts parse what the api sends", () => {
  expect(Health.parse({ ok: true, service: "api" })).toEqual({ ok: true, service: "api" });
  expect(ApiErrorBody.safeParse({ error: { code: "not_found" } }).success).toBe(false);
});
