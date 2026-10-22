import { expect, test, vi } from "vitest";
import { homeFor, safeNext } from "./session";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }));

test("safeNext keeps paths on this site only", () => {
  expect(safeNext("/coach")).toBe("/coach");
  expect(safeNext("/account?tab=1")).toBe("/account?tab=1");
  expect(safeNext("//evil.example")).toBeUndefined();
  expect(safeNext("/\\evil.example")).toBeUndefined();
  expect(safeNext("https://evil.example")).toBeUndefined();
  expect(safeNext(["/coach"])).toBeUndefined();
});

test("staff land in the coach area, everyone else in their account", () => {
  expect(homeFor("head_coach")).toBe("/coach");
  expect(homeFor("athlete")).toBe("/account");
});
