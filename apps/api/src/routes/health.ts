import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { Health } from "@jakamarinko/api";
import { db } from "@jakamarinko/db";

// The deploy waits for this, so a broken database connection fails the deploy.
export const health = new Hono().get("/", async (c) => {
  await db().execute(sql`select 1`);
  return c.json<Health>({ ok: true, service: "api" });
});
