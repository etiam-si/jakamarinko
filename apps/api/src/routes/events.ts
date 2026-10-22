import { Hono } from "hono";
import { z } from "zod";
import type { TagsConfig } from "@jakamarinko/api";

// All optional: a missing id means that tag is off, not an error.
const TagsEnv = z.object({
  UMAMI_URL: z.url().optional(),
  UMAMI_WEBSITE_ID: z.string().min(1).optional(),
  META_PIXEL_ID: z.string().min(1).optional(),
  GOOGLE_TAG_ID: z.string().min(1).optional(),
});

export function tagsConfig(source: Record<string, string | undefined> = process.env): TagsConfig {
  const e = TagsEnv.parse(Object.fromEntries(Object.entries(source).filter(([, v]) => v !== "")));
  return {
    umami: e.UMAMI_URL && e.UMAMI_WEBSITE_ID ? { src: `${e.UMAMI_URL.replace(/\/$/, "")}/script.js`, websiteId: e.UMAMI_WEBSITE_ID } : null,
    metaPixelId: e.META_PIXEL_ID ?? null,
    googleTagId: e.GOOGLE_TAG_ID ?? null,
  };
}

export const events = new Hono().get("/config", (c) => {
  c.header("cache-control", "public, max-age=300");
  return c.json<TagsConfig>(tagsConfig());
});
