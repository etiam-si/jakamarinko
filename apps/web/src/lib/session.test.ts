import { expect, test, vi } from "vitest";
import { homeFor, requestedPath, safeNext } from "./session";

const request = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => request.headers }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }));

test("safeNext keeps paths on this site only", () => {
  expect(safeNext("/coach")).toBe("/coach");
  expect(safeNext("/account?tab=1")).toBe("/account?tab=1");
  expect(safeNext("//evil.example")).toBeUndefined();
  expect(safeNext("/\\evil.example")).toBeUndefined();
  expect(safeNext("https://evil.example")).toBeUndefined();
  expect(safeNext(["/coach"])).toBeUndefined();
  // Browsers drop tabs and newlines in URLs, which would turn these into //evil.example.
  expect(safeNext("/\t/evil.example")).toBeUndefined();
  expect(safeNext("/\n/evil.example")).toBeUndefined();
});

test("requestedPath: the page asked for, query included, without the locale; unsafe or missing gives the fallback", async () => {
  const at = (url?: string) => (request.headers = new Headers(url ? { "x-request-url": url } : {}));
  at("/sl/account/privacy/delete?token=abc_123");
  expect(await requestedPath("sl", "/account")).toBe("/account/privacy/delete?token=abc_123");
  at("/en/coach/requests/7");
  expect(await requestedPath("en", "/coach")).toBe("/coach/requests/7");
  at("/en//evil.example");
  expect(await requestedPath("en", "/account")).toBe("/account");
  at();
  expect(await requestedPath("en", "/account")).toBe("/account");
});

test("staff land in the coach area, everyone else in their account", () => {
  expect(homeFor("head_coach")).toBe("/coach");
  expect(homeFor("athlete")).toBe("/account");
});
