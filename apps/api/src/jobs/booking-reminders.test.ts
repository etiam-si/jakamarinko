import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { bookings, serviceTypes } from "@jakamarinko/db/schema";
import { consoleTransport, setTransport } from "@jakamarinko/email";
import { seedFixtures, testDb } from "../booking/test-db";
import { sendReminders } from "./booking-reminders";

const holder = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));

let database: Awaited<ReturnType<typeof testDb>>;
let ids: Awaited<ReturnType<typeof seedFixtures>>;
let outbox: string;

beforeAll(async () => {
  database = await testDb();
  holder.db = database;
  ids = await seedFixtures();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

beforeEach(async () => {
  await database.delete(bookings);
  outbox = await mkdtemp(path.join(tmpdir(), "jm-emails-"));
  // The dev transport: what lands in .emails/.
  setTransport(consoleTransport(outbox));
});

afterEach(async () => rm(outbox, { recursive: true, force: true }));

const now = new Date("2026-11-02T10:00:00Z");

async function insertBooking(startAt: Date, status: "confirmed" | "cancelled" | "pending_payment" = "confirmed") {
  const [service] = await database.select().from(serviceTypes);
  const [row] = await database
    .insert(bookings)
    .values({
      serviceTypeId: service!.id,
      coachId: ids.jakaCoachId,
      locationId: ids.labId,
      customerName: "Ana",
      customerEmail: "ana@example.com",
      customerPhone: "+386 41 000 000",
      startAt,
      endAt: new Date(startAt.getTime() + 3_600_000),
      status,
      locale: "sl",
      manageToken: "t",
    })
    .returning();
  return row!;
}

test("run twice, the reminder goes out once (checked in the .emails outbox)", async () => {
  await insertBooking(new Date("2026-11-03T08:00:00Z")); // 22 h ahead

  expect(await sendReminders(now)).toBe(1);
  expect(await sendReminders(now)).toBe(0);
  expect(await sendReminders(new Date(now.getTime() + 5 * 60_000))).toBe(0);

  const files = await readdir(outbox);
  expect(files).toHaveLength(1);
  expect(await readFile(path.join(outbox, files[0]!), "utf8")).toContain("Opomnik");
});

test("two workers at once still send one", async () => {
  await insertBooking(new Date("2026-11-03T08:00:00Z"));
  const sent = await Promise.all([sendReminders(now), sendReminders(now)]);
  expect(sent.reduce((a, b) => a + b)).toBe(1);
  expect(await readdir(outbox)).toHaveLength(1);
});

test("only confirmed bookings starting within the next 24 h", async () => {
  await insertBooking(new Date("2026-11-03T11:00:00Z")); // 25 h ahead
  await insertBooking(new Date("2026-11-02T09:00:00Z")); // already started
  await insertBooking(new Date("2026-11-02T20:00:00Z"), "cancelled");
  await insertBooking(new Date("2026-11-02T20:00:00Z"), "pending_payment");
  expect(await sendReminders(now)).toBe(0);
  expect(await sendReminders(new Date("2026-11-02T11:00:00Z"))).toBe(1);
});

test("a failed send is released and retried on the next run", async () => {
  await insertBooking(new Date("2026-11-03T08:00:00Z"));
  vi.spyOn(console, "warn").mockImplementation(() => {});
  setTransport(async () => ({ ok: false, error: "smtp down" }));
  expect(await sendReminders(now)).toBe(0);
  setTransport(consoleTransport(outbox));
  expect(await sendReminders(now)).toBe(1);
  expect(await readdir(outbox)).toHaveLength(1);
});
