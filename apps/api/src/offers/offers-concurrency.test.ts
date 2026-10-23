import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import pg from "pg";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { db, runMigrations } from "@jakamarinko/db";
import { availability, bookings, offerCodes, offerRedemptions } from "@jakamarinko/db/schema";
import { setTransport } from "@jakamarinko/email";
import { app } from "../app";
import { sampleWeek } from "../booking/seed";
import { seedFixtures } from "../booking/test-db";

// The single-use race of offers.test.ts on a real Postgres with a connection pool, where the bookings truly run at
// the same time, on two coaches (so only the code's lock stands between them). Needs DATABASE_URL (CI has it).
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
  await db().insert(availability).values(sampleWeek.map((d) => ({ ...d, coachId: ids.majaCoachId, locationId: ids.labId })));
  await db().insert(offerCodes).values({ code: "ONLYONE", kind: "promo", discountType: "free", maxUses: 1 });
  setTransport(async () => ({ ok: true, id: "x" }));
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

test.skipIf(!adminUrl)("real Postgres: a single-use code in 5 parallel bookings of different slots gives exactly 1 success", async () => {
  const slots = [
    [ids.jakaCoachId, "2026-11-02T15:00:00.000Z"],
    [ids.majaCoachId, "2026-11-02T15:00:00.000Z"],
    [ids.jakaCoachId, "2026-11-03T15:00:00.000Z"],
    [ids.majaCoachId, "2026-11-03T15:00:00.000Z"],
    [ids.jakaCoachId, "2026-11-04T15:00:00.000Z"],
  ];
  const results = await Promise.all(
    slots.map(([coachId, start], i) =>
      app.request("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          service: "lactate-profile",
          coachId,
          start,
          name: `Runner ${i}`,
          email: `runner${i}@example.com`,
          phone: "+386 41 000 000",
          locale: "en",
          code: "onlyone",
        }),
      }),
    ),
  );
  expect(results.map((r) => r.status).sort()).toEqual([201, 422, 422, 422, 422]);
  expect(await db().select().from(bookings)).toHaveLength(1);
  expect(await db().select().from(offerRedemptions)).toHaveLength(1);
});
