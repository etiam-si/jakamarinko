import { expect, test } from "vitest";
import { TagsConfig } from "@jakamarinko/api";
import { events, tagsConfig } from "./events";

test("no ids set (or empty ones): every tag is off", () => {
  const off = { umami: null, metaPixelId: null, googleTagId: null };
  expect(tagsConfig({})).toEqual(off);
  expect(tagsConfig({ UMAMI_URL: "", META_PIXEL_ID: "", GOOGLE_TAG_ID: "" })).toEqual(off);
});

test("Umami needs both its url and website id", () => {
  expect(tagsConfig({ UMAMI_URL: "https://analytics.jakamarinko.com" }).umami).toBeNull();
  expect(tagsConfig({ UMAMI_URL: "https://analytics.jakamarinko.com/", UMAMI_WEBSITE_ID: "w1" }).umami).toEqual({
    src: "https://analytics.jakamarinko.com/script.js",
    websiteId: "w1",
  });
});

test("GET /config", async () => {
  const res = await events.request("/config");
  expect(res.status).toBe(200);
  expect(TagsConfig.safeParse(await res.json()).success).toBe(true);
});
