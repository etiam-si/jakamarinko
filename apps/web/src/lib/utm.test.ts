import { beforeEach, expect, test, vi } from "vitest";
import { captureAttribution, getAttribution } from "./utm";

// One cookie is enough here, so a plain string stands in for document.cookie.
let jar: { cookie: string };
beforeEach(() => {
  jar = { cookie: "" };
  vi.stubGlobal("document", jar);
  vi.stubGlobal("location", { protocol: "https:" });
});
const stored = () => jar.cookie.split(";")[0];

test("utm, fbclid and gclid are kept; other params are not", () => {
  captureAttribution("?utm_source=instagram&utm_campaign=x&fbclid=abc&page=2");
  expect(jar.cookie).toContain("Max-Age=2592000");
  expect(getAttribution(stored())).toEqual({ utm_source: "instagram", utm_campaign: "x", fbclid: "abc" });
});

test("a landing without any of them keeps the earlier source", () => {
  captureAttribution("?utm_source=instagram");
  captureAttribution("?page=2");
  expect(getAttribution(stored())).toEqual({ utm_source: "instagram" });
});

test("the last link wins as a whole", () => {
  captureAttribution("?utm_source=instagram&utm_campaign=x");
  captureAttribution("?gclid=g1");
  expect(getAttribution(stored())).toEqual({ gclid: "g1" });
});

test("no cookie or a broken one is null", () => {
  expect(getAttribution("")).toBeNull();
  expect(getAttribution("jm_attribution=%7Bnope")).toBeNull();
});
