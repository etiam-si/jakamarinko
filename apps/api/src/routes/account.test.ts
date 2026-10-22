import { eq } from "drizzle-orm";
import { strFromU8, unzipSync } from "fflate";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { AccountBooking, AccountExport, ApiErrorBody, Booking, CoachBooking, ConsentRecord, CreatedBooking, isDeletedCustomer, Profile } from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import { bookings, consents, profiles, sessions, users, verifications } from "@jakamarinko/db/schema";
import { setTransport, type RenderedEmail } from "@jakamarinko/email";
import { app } from "../app";
import { people, seedFixtures, testDb } from "../booking/test-db";
import { toCsv } from "./account";

const holder = vi.hoisted(() => ({ db: undefined as unknown, user: null as SessionUser | null }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));
vi.mock("@jakamarinko/auth", () => ({
  getSessionUser: async () => holder.user,
  hasConsent: async () => true,
}));

let database: Awaited<ReturnType<typeof testDb>>;
let ids: Awaited<ReturnType<typeof seedFixtures>>;
const outbox: RenderedEmail[] = [];

// Sunday 1 November 2026, 13:00 in Ljubljana. Monday 16:00 is 27 h away.
const now = new Date("2026-11-01T12:00:00Z");
const monday16 = "2026-11-02T15:00:00.000Z";
const afterMonday = new Date("2026-11-03T12:00:00Z");

beforeAll(async () => {
  database = await testDb();
  holder.db = database;
  ids = await seedFixtures();
  setTransport(async (email) => {
    outbox.push(email);
    return { ok: true, id: String(outbox.length) };
  });
});

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"], now });
  holder.user = null;
  outbox.length = 0;
  await database.delete(bookings);
  await database.delete(consents);
  await database.delete(profiles);
  await database.delete(verifications);
  // A test may have deleted Ana.
  await database
    .insert(users)
    .values({ ...people.ana, emailVerified: true })
    .onConflictDoNothing();
  await database.update(users).set({ name: "ana", locale: "en", emailVerified: true }).where(eq(users.id, people.ana.id));
});

afterEach(() => vi.useRealTimers());

const as = (user: SessionUser | null) => (holder.user = user);
const send = (method: string, path: string, body?: unknown) =>
  app.request(`/api${path}`, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const errorCode = async (res: Response) => ApiErrorBody.parse(await res.json()).error.code;

// A guest booking (nobody signed in) for Ana's email, Monday 16:00.
async function bookAsGuest(overrides: Record<string, unknown> = {}) {
  const signedIn = holder.user;
  as(null);
  const res = await send("POST", "/booking", {
    service: "performance",
    coachId: ids.jakaCoachId,
    start: monday16,
    name: "Ana Novak",
    email: "ANA@example.com",
    phone: "+386 41 000 000",
    locale: "en",
    healthAnswers: { chest_pain: false, medication: "none" },
    healthConsent: true,
    utm: { utm_source: "instagram" },
    ...overrides,
  });
  expect(res.status, await res.clone().text()).toBe(201);
  as(signedIn);
  return CreatedBooking.parse(await res.json()).booking;
}

const myBookings = async (query = "") => AccountBooking.array().parse(await (await send("GET", `/account/bookings${query}`)).json());

describe("bookings", () => {
  test("a guest booking with the same verified email joins the account, with how to prepare", async () => {
    const booked = await bookAsGuest();
    as(people.ana);
    const [mine] = await myBookings();
    expect(mine).toMatchObject({ id: booked.id, service: "performance", status: "confirmed", cancellable: true });
    // The Performance package contains the fat/carb test: fasted.
    expect(mine!.preparation.join(" ")).toMatch(/fast/i);
    // And from now on it is theirs everywhere, also in T07's /booking/mine.
    expect(Booking.array().parse(await (await send("GET", "/booking/mine")).json()).map((b) => b.id)).toEqual([booked.id]);

    const [sl] = await myBookings("?locale=sl");
    expect(sl!.serviceName).toBe("Performance paket");
  });

  test("an unverified email doesn't pick up guest bookings, and nobody else's show up", async () => {
    await bookAsGuest();
    await database.update(users).set({ emailVerified: false }).where(eq(users.id, people.ana.id));
    as(people.ana);
    expect(await myBookings()).toEqual([]);
    as(people.bo);
    expect(await myBookings()).toEqual([]);
  });

  test("add to calendar: an .ics for your own booking only", async () => {
    const booked = await bookAsGuest();
    as(people.ana);
    await myBookings();
    const res = await send("GET", `/account/bookings/${booked.id}/calendar?locale=sl`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/calendar");
    const ics = await res.text();
    expect(ics).toContain("DTSTART;TZID=Europe/Ljubljana:20261102T160000");
    expect(ics).toContain("SUMMARY:Performance paket\\, Jaka Marinko");

    as(people.bo);
    expect((await send("GET", `/account/bookings/${booked.id}/calendar`)).status).toBe(404);
  });

  test("signed out: 401", async () => {
    expect((await send("GET", "/account/bookings")).status).toBe(401);
    expect((await send("GET", "/account/profile")).status).toBe(401);
  });
});

describe("profile", () => {
  test("starts with the phone from the latest booking; saving changes name, phone and the language of upcoming bookings", async () => {
    const booked = await bookAsGuest();
    as(people.ana);
    await myBookings();
    expect(Profile.parse(await (await send("GET", "/account/profile")).json())).toEqual({
      name: "ana",
      email: "ana@example.com",
      phone: "+386 41 000 000",
      locale: "en",
    });

    const res = await send("PUT", "/account/profile", { name: " Ana Novak ", phone: "+386 40 123 456", locale: "sl" });
    expect(Profile.parse(await res.json())).toEqual({ name: "Ana Novak", email: "ana@example.com", phone: "+386 40 123 456", locale: "sl" });
    const [row] = await database.select({ locale: bookings.locale }).from(bookings).where(eq(bookings.id, booked.id));
    expect(row!.locale).toBe("sl");

    // An empty phone clears it.
    await send("PUT", "/account/profile", { name: "Ana", phone: "", locale: "sl" });
    const [saved] = await database.select().from(profiles).where(eq(profiles.userId, people.ana.id));
    expect(saved!.phone).toBeNull();
  });

  test("input is validated", async () => {
    as(people.ana);
    expect((await send("PUT", "/account/profile", { name: "", phone: "", locale: "en" })).status).toBe(400);
    expect((await send("PUT", "/account/profile", { name: "Ana", phone: "12", locale: "en" })).status).toBe(400);
    expect((await send("PUT", "/account/profile", { name: "Ana", phone: "", locale: "de" })).status).toBe(400);
  });
});

test("consents: the whole history with dates; a withdrawn grant keeps its row", async () => {
  await database.insert(consents).values([
    { userId: people.ana.id, kind: "health_data", version: "2026-10-22", grantedAt: new Date("2026-10-23T08:00:00Z") },
    {
      userId: people.ana.id,
      kind: "marketing",
      version: "2026-10-22",
      grantedAt: new Date("2026-10-22T08:00:00Z"),
      withdrawnAt: new Date("2026-10-24T08:00:00Z"),
    },
    { userId: people.bo.id, kind: "marketing", version: "2026-10-22" },
  ]);
  as(people.ana);
  expect(ConsentRecord.array().parse(await (await send("GET", "/account/consents")).json())).toEqual([
    { kind: "health_data", version: "2026-10-22", grantedAt: "2026-10-23T08:00:00.000Z", withdrawnAt: null },
    { kind: "marketing", version: "2026-10-22", grantedAt: "2026-10-22T08:00:00.000Z", withdrawnAt: "2026-10-24T08:00:00.000Z" },
  ]);
});

describe("export", () => {
  test("a zip with data.json (profile, consents, bookings) and the same as CSV, only the signed-in user's", async () => {
    await bookAsGuest();
    await bookAsGuest({ email: "bo@example.com", name: "Bo", start: "2026-11-03T15:00:00.000Z", service: "vo2max" });
    await database.insert(consents).values({ userId: people.ana.id, kind: "health_data", version: "2026-10-22" });
    await database.insert(consents).values({ userId: people.bo.id, kind: "marketing", version: "2026-10-22" });

    as(people.ana);
    const res = await send("GET", "/account/export");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="jakamarinko-data-2026-11-01.zip"');

    const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
    expect(Object.keys(files).sort()).toEqual(["bookings.csv", "consents.csv", "data.json", "profile.csv"]);
    const data = AccountExport.parse(JSON.parse(strFromU8(files["data.json"]!)));
    expect(data.profile).toMatchObject({ id: people.ana.id, email: "ana@example.com", role: "customer" });
    expect(data.consents).toEqual([expect.objectContaining({ kind: "health_data", withdrawnAt: null })]);
    expect(data.bookings).toHaveLength(1);
    expect(data.bookings[0]).toMatchObject({
      service: "performance",
      name: "Ana Novak",
      healthAnswers: { chest_pain: false, medication: "none" },
      utm: { utm_source: "instagram" },
    });
    expect(JSON.stringify(data)).not.toContain("bo@example.com");

    const csv = strFromU8(files["bookings.csv"]!).split("\r\n");
    expect(csv[0]).toMatch(/^id,service,serviceName,status,/);
    expect(csv[1]).toContain('"{""chest_pain"":false,""medication"":""none""}"');
    expect(strFromU8(files["profile.csv"]!)).toContain("ana@example.com");
  });

  test("signed out: 401", async () => {
    expect((await send("GET", "/account/export")).status).toBe(401);
  });

  test("CSV quotes commas, quotes and line breaks", () => {
    expect(toCsv([{ a: 'say "hi", ok', b: "x\ny", c: null }])).toBe('a,b,c\r\n"say ""hi"", ok","x\ny",\r\n');
  });
});

describe("delete", () => {
  // The token from the newest confirmation email.
  const tokenFromEmail = () => {
    const email = outbox.at(-1)!;
    return new URL(/href="([^"]+)"/.exec(email.html)![1]!.replaceAll("&amp;", "&")).searchParams.get("token")!;
  };

  async function pastBooking() {
    const booked = await bookAsGuest();
    as(people.ana);
    await myBookings();
    vi.setSystemTime(afterMonday);
    outbox.length = 0;
    return booked;
  }

  test("asks by email first; only the same signed-in user can confirm; then the account is gone and the booking anonymised", async () => {
    const booked = await pastBooking();
    await database.insert(consents).values({ userId: people.ana.id, kind: "health_data", version: "2026-10-22" });
    await database.insert(sessions).values({ id: "s1", token: "t1", userId: people.ana.id, expiresAt: new Date("2027-01-01") });

    const asked = await send("POST", "/account/delete");
    expect(asked.status).toBe(202);
    expect(outbox.map((e) => [e.to, e.subject])).toEqual([["ana@example.com", "Confirm deleting your account"]]);
    expect(outbox[0]!.html).toContain("/en/account/privacy/delete?token=");
    // Nothing deleted yet.
    expect(await database.select().from(users).where(eq(users.id, people.ana.id))).toHaveLength(1);
    const token = tokenFromEmail();

    // Someone else, signed in, with Ana's link: refused.
    as(people.bo);
    const other = await send("POST", "/account/delete/confirm", { token });
    expect(other.status).toBe(400);
    expect(await errorCode(other)).toBe("invalid_token");
    as(people.ana);
    expect(await errorCode(await send("POST", "/account/delete/confirm", { token: "x".repeat(43) }))).toBe("invalid_token");

    expect((await send("POST", "/account/delete/confirm", { token })).status).toBe(204);
    expect(await database.select().from(users).where(eq(users.id, people.ana.id))).toEqual([]);
    expect(await database.select().from(sessions).where(eq(sessions.userId, people.ana.id))).toEqual([]);
    expect(await database.select().from(consents).where(eq(consents.userId, people.ana.id))).toEqual([]);
    // The link works once.
    expect((await send("POST", "/account/delete/confirm", { token })).status).toBe(400);

    // The coach still has the booking, as a deleted user.
    as(people.jaka);
    const res = await send("GET", `/booking/coach/bookings?from=2026-11-02&to=2026-11-02`);
    const [seen] = CoachBooking.array().parse(await res.json());
    expect(seen).toMatchObject({ id: booked.id, name: "", email: "", phone: "", customerUserId: null, healthAnswers: null, healthFlag: false });
    expect(isDeletedCustomer(seen!)).toBe(true);

    // Signing in again with that email makes a fresh, empty account.
    const fresh = { ...people.ana, id: "ana-2" };
    await database.insert(users).values({ ...fresh, emailVerified: true });
    as(fresh);
    expect(await myBookings()).toEqual([]);
    expect(Profile.parse(await (await send("GET", "/account/profile")).json())).toMatchObject({ phone: null });
    expect(await (await send("GET", "/account/consents")).json()).toEqual([]);
    await database.delete(users).where(eq(users.id, fresh.id));
  });

  test("what deletion keeps: anonymised booking rows for 10 years of accounting, nothing that names the person", async () => {
    await pastBooking();
    await send("POST", "/account/delete");
    await send("POST", "/account/delete/confirm", { token: tokenFromEmail() });

    // Slovenian rules (ZDDV-1, keeping invoices) require invoices and the records behind them for 10 years.
    // A booking row is that record. Every column that still holds something after deletion is listed here with why.
    const kept: Record<string, string> = {
      id: "the invoice refers to it",
      serviceTypeId: "what was sold",
      coachId: "who delivered it (coach pay, the coach's own calendar history)",
      locationId: "where it was delivered (VAT place of supply)",
      startAt: "when it was delivered",
      endAt: "when it was delivered",
      status: "whether it was delivered, cancelled or a no-show",
      paidVia: "how it was paid",
      locale: "the language of the invoice",
      manageToken: "required by the table; replaced with a new random value, so old email links stop working",
      createdAt: "when it was sold",
      updatedAt: "when the row last changed (this anonymisation)",
      // Empty strings: the columns are required, nothing of the person remains.
      customerName: "emptied",
      customerEmail: "emptied",
      customerPhone: "emptied",
    };
    const [row] = await database.select().from(bookings);
    const filled = Object.entries(row!)
      .filter(([, v]) => v !== null)
      .map(([k]) => k);
    expect(filled.sort()).toEqual(Object.keys(kept).sort());
    expect(row).toMatchObject({ customerName: "", customerEmail: "", customerPhone: "", customerUserId: null, healthAnswers: null, utm: null });
    // Payment ids (T13) stay too when set: they tie the row to the payment for the books.
  });

  test("not with upcoming bookings, not for staff, not signed out", async () => {
    await bookAsGuest();
    as(people.ana);
    await myBookings();
    outbox.length = 0;
    const res = await send("POST", "/account/delete");
    expect(res.status).toBe(409);
    expect(await errorCode(res)).toBe("upcoming_bookings");
    expect(outbox).toEqual([]);

    as(people.maja);
    expect(await errorCode(await send("POST", "/account/delete"))).toBe("staff_account");
    as(null);
    expect((await send("POST", "/account/delete")).status).toBe(401);
    expect((await send("POST", "/account/delete/confirm", { token: "x".repeat(43) })).status).toBe(401);
  });

  test("an expired link is refused", async () => {
    await pastBooking();
    await send("POST", "/account/delete");
    const token = tokenFromEmail();
    vi.setSystemTime(new Date(afterMonday.getTime() + 61 * 60_000));
    expect(await errorCode(await send("POST", "/account/delete/confirm", { token }))).toBe("invalid_token");
  });
});
