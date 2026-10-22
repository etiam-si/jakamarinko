import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import pg from "pg";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { db, runMigrations } from "@jakamarinko/db";
import { bookings } from "@jakamarinko/db/schema";
import { setTransport } from "@jakamarinko/email";
import { app } from "../app";
import { seedFixtures } from "../booking/test-db";

// The same race as in booking.test.ts, but on a real Postgres with a connection pool, where the requests truly run
// at the same time. Needs DATABASE_URL (CI has it; locally: DATABASE_URL=… pnpm test). Uses a throwaway database.
vi.mock("@jakamarinko/auth", () => ({ getSessionUser: async () => null, hasConsent: async () => true }));

const adminUrl = process.env.DATABASE_URL;
const name = `jm_test_${randomBytes(4).toString("hex")}`;
let ids: Awaited<ReturnType<typeof seedFixtures>>;

beforeAll(async () => {
  if (!adminUrl) return;
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  process.env.DATABASE_URL = url.toString();
  await runMigrations();
  ids = await seedFixtures();
  setTransport(async () => ({ ok: true, id: "x" }));
  // Ten open connections, so no request waits for a connect and they really overlap.
  await Promise.all(Array.from({ length: 10 }, () => db().execute(sql`select pg_sleep(0.1)`)));
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-01T12:00:00Z") });
});

afterAll(async () => {
  if (!adminUrl) return;
  vi.useRealTimers();
  await db().$client.end();
  process.env.DATABASE_URL = adminUrl;
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`drop database if exists ${name} with (force)`);
  await admin.end();
});

test.skipIf(!adminUrl)("real Postgres: 10 parallel bookings of the same slot give exactly 1 success and 9 × 409", async () => {
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      app.request("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          service: "lactate-profile",
          coachId: ids.jakaCoachId,
          start: "2026-11-02T15:00:00.000Z",
          name: `Runner ${i}`,
          email: `runner${i}@example.com`,
          phone: "+386 41 000 000",
          locale: "en",
        }),
      }),
    ),
  );
  expect(results.map((r) => r.status).sort()).toEqual([201, ...Array(9).fill(409)]);
  expect(await db().select().from(bookings)).toHaveLength(1);
});
