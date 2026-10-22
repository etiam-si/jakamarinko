import { sql } from "drizzle-orm";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import type { SessionUser } from "@jakamarinko/auth";
import { setTransport, consoleTransport } from "@jakamarinko/email";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { app } from "../app";
import { sendReminders } from "../jobs/booking-reminders";
import { people, seedFixtures, testDb } from "../booking/test-db";

const holder = vi.hoisted(() => ({ db: undefined as unknown, user: null as SessionUser | null }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));
vi.mock("@jakamarinko/auth", () => ({ getSessionUser: async () => holder.user, hasConsent: async () => true }));

// Answers no other text would contain, so finding any of them in the log means health data leaked.
const secret = "ZX-ASTHMA-7731";
const answers = { chest_pain: true, medication: `inhaler ${secret}`, notes: `${secret} after a fall` };

let database: Awaited<ReturnType<typeof testDb>>;
let ids: Awaited<ReturnType<typeof seedFixtures>>;
let outbox: string;
const log: string[] = [];

beforeAll(async () => {
  database = await testDb();
  holder.db = database;
  ids = await seedFixtures();
  outbox = await mkdtemp(path.join(tmpdir(), "jm-emails-"));
  // The dev transport logs a line per email; it must not carry the answers either.
  setTransport(consoleTransport(outbox));
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-01T12:00:00Z") });

  // Everything that could reach a log: console and the raw streams.
  for (const level of ["log", "info", "warn", "error", "debug", "trace"] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => void log.push(args.map(String).join(" ")));
  }
  for (const stream of [process.stdout, process.stderr]) {
    const write = stream.write.bind(stream);
    vi.spyOn(stream, "write").mockImplementation(((chunk: unknown, ...rest: never[]) => {
      log.push(String(chunk));
      return write(chunk as string, ...rest);
    }) as typeof stream.write);
  }
});

afterEach(async () => {
  vi.useRealTimers();
  await rm(outbox, { recursive: true, force: true });
});

const post = (path: string, body: unknown) =>
  app.request(`/api/booking${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const booking = (overrides: Record<string, unknown> = {}) => ({
  service: "performance",
  coachId: ids.jakaCoachId,
  start: "2026-11-02T15:00:00.000Z",
  name: "Ana",
  email: "ana@example.com",
  phone: "+386 41 000 000",
  locale: "en",
  healthAnswers: answers,
  healthConsent: true,
  ...overrides,
});

test("health questionnaire answers never appear in the log output", async () => {
  // A booking with answers, its emails, a double booking, the coach's list and the reminder.
  expect((await post("", booking())).status).toBe(201);
  expect((await post("", booking({ email: "bo@example.com" }))).status).toBe(409);
  holder.user = people.jaka;
  expect((await app.request(`/api/booking/coach/bookings?from=2026-11-02&to=2026-11-02`)).status).toBe(200);
  holder.user = null;
  vi.setSystemTime(new Date("2026-11-01T16:00:00Z"));
  expect(await sendReminders()).toBe(1);

  // Invalid input next to the answers: the error names fields, never values.
  const invalid = await post("", booking({ email: "not-an-email", healthAnswers: { ...answers, [`x${"y".repeat(50)}`]: secret } }));
  expect(invalid.status).toBe(400);
  expect(await invalid.text()).not.toContain(secret);

  // A database failure while writing the answers: Drizzle's error message would carry them.
  await database.execute(sql`create function fail_booking() returns trigger language plpgsql as $$ begin raise exception 'disk full'; end $$`);
  await database.execute(sql`create trigger fail_booking before insert on bookings for each row execute function fail_booking()`);
  const crash = await post("", booking({ start: "2026-11-03T15:00:00.000Z" }));
  await database.execute(sql`drop trigger fail_booking on bookings`);
  expect(crash.status).toBe(500);
  expect(log.join("\n")).toContain("booking insert failed");

  expect(log.length).toBeGreaterThan(0);
  const output = log.join("\n");
  expect(output).not.toContain(secret);
  expect(output).not.toContain("inhaler");
  expect(output).not.toContain("chest_pain");
});
