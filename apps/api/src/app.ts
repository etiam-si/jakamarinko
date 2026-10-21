import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { Health } from "@jakamarinko/shared";
import { db } from "./db";

// Everything lives under /api: on the server Traefik sends jakamarinko.com/api/* here, the rest to web.
export const app = new Hono().basePath("/api");

// The deploy waits for this, so a broken database connection fails the deploy.
app.get("/health", async (c) => {
  await db().execute(sql`select 1`);
  return c.json<Health>({ ok: true, service: "api" });
});
