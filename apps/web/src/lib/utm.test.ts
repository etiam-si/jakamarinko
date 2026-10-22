import { beforeEach, expect, test, vi } from "vitest";
import { serializeConsent } from "./consent";
import { captureAttribution, getAttribution, storeAttribution } from "./utm";

// A minimal document.cookie: assignments add or (Max-Age=0) remove one cookie, reads join them all.
let jar: Map<string, string>;
beforeEach(() => {
  jar = new Map();
  const document = {
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(line: string) {
      const [pair, ...attrs] = line.split("; ");
      const [name, value] = pair.split("=");
      if (attrs.includes("Max-Age=0")) jar.delete(name);
      else jar.set(name, value);
    },
  };
  vi.stubGlobal("document", document);
  vi.stubGlobal("location", { protocol: "https:" });
  storeAttribution(); // drops what an earlier test left in memory
  jar.clear();
});
const consent = (marketing: boolean) =>
  jar.set("jm_consent", encodeURIComponent(serializeConsent({ analytics: false, marketing })));

test("without marketing consent nothing is written", () => {
  captureAttribution("?utm_source=instagram");
  expect(jar.has("jm_attribution")).toBe(false);
  consent(false);
  captureAttribution("?utm_source=instagram");
  expect(jar.has("jm_attribution")).toBe(false);
});

test("consent given later in the visit stores what the landing captured", () => {
  captureAttribution("?utm_source=instagram&utm_campaign=x&fbclid=abc&page=2");
  consent(true);
  storeAttribution();
  expect(getAttribution(document.cookie)).toEqual({ utm_source: "instagram", utm_campaign: "x", fbclid: "abc" });
});

test("with consent already given it's stored at once", () => {
  consent(true);
  captureAttribution("?gclid=g1");
  expect(getAttribution(document.cookie)).toEqual({ gclid: "g1" });
});

test("a landing without any of them keeps the earlier source", () => {
  consent(true);
  captureAttribution("?utm_source=instagram");
  captureAttribution("?page=2");
  expect(getAttribution(document.cookie)).toEqual({ utm_source: "instagram" });
});

test("the last link wins as a whole", () => {
  consent(true);
  captureAttribution("?utm_source=instagram&utm_campaign=x");
  captureAttribution("?gclid=g1");
  expect(getAttribution(document.cookie)).toEqual({ gclid: "g1" });
});

test("no cookie or a broken one is null", () => {
  expect(getAttribution("")).toBeNull();
  expect(getAttribution("jm_attribution=%7Bnope")).toBeNull();
});
