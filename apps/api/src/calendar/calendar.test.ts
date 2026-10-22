import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiErrorBody, CalendarChoice, CalendarStatus, ConnectCalendar, CreatedBooking, Slot } from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import { bookings, calendarConnections, calendarEvents } from "@jakamarinko/db/schema";
import { setTransport } from "@jakamarinko/email";
import { app } from "../app";
import { people, seedFixtures, testDb } from "../booking/test-db";
import { cut } from "./busy";
import { decrypt, encrypt, signState, verifyState } from "./crypto";
import { fakeGoogle } from "./fake-google";
import { syncCalendars } from "./sync";

const holder = vi.hoisted(() => ({ db: undefined as unknown, user: null as SessionUser | null }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));
vi.mock("@jakamarinko/auth", () => ({
  getSessionUser: async () => holder.user,
  hasConsent: async () => true,
}));

let database: Awaited<ReturnType<typeof testDb>>;
let ids: Awaited<ReturnType<typeof seedFixtures>>;
let google: Awaited<ReturnType<typeof fakeGoogle>>;
const key = Buffer.alloc(32, 7);

// Sunday 1 November 2026, 13:00 in Ljubljana. Jaka's sample week has Monday 16:00–20:00.
const now = new Date("2026-11-01T12:00:00Z");
const monday16 = "2026-11-02T15:00:00.000Z";
const monday18 = "2026-11-02T17:00:00.000Z";

beforeAll(async () => {
  database = await testDb();
  holder.db = database;
  ids = await seedFixtures();
  google = await fakeGoogle();
  setTransport(async () => ({ ok: true, id: "1" }));
});

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"], now });
  vi.stubEnv("GOOGLE_CLIENT_ID", "client-id");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
  vi.stubEnv("CALENDAR_TOKEN_KEY", key.toString("base64"));
  vi.stubEnv("CALENDAR_GOOGLE_BASE", google.url);
  vi.stubEnv("BETTER_AUTH_URL", "https://site.test");
  holder.user = null;
  Object.assign(google.state, { requests: [], busy: [], revoked: false, failWith: undefined });
  google.state.events.clear();
  await database.delete(calendarEvents);
  await database.delete(calendarConnections);
  await database.delete(bookings);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
afterAll(() => google.close());

const as = (user: SessionUser | null) => (holder.user = user);
const send = (method: string, path: string, body?: unknown) =>
  app.request(`/api${path}`, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const errorCode = async (res: Response) => ApiErrorBody.parse(await res.json()).error.code;
const status = async () => CalendarStatus.parse(await (await send("GET", "/calendar")).json());
const connection = async () => (await database.select().from(calendarConnections))[0];

// Jaka goes through Google's consent screen and comes back with a code.
async function connect(code = "good-code") {
  as(people.jaka);
  const { url } = ConnectCalendar.parse(await (await send("POST", "/calendar/google/connect", { locale: "sl" })).json());
  const state = new URL(url).searchParams.get("state")!;
  const res = await send("GET", `/calendar/google/callback?code=${code}&state=${encodeURIComponent(state)}`);
  expect(res.status).toBe(302);
  return res.headers.get("location");
}

const health = { chest_pain: true, medication: "beta blockers" };

async function book(start = monday16) {
  as(null);
  const res = await send("POST", "/booking", {
    service: "performance",
    coachId: ids.jakaCoachId,
    start,
    name: "Ana Marija Novak",
    email: "ana.novak@example.com",
    phone: "+386 41 555 123",
    locale: "en",
    healthAnswers: health,
    healthConsent: true,
  });
  expect(res.status, await res.clone().text()).toBe(201);
  return CreatedBooking.parse(await res.json()).booking;
}

async function slots() {
  as(null);
  const res = await send("GET", "/booking/slots?service=performance&from=2026-11-02&to=2026-11-02");
  return Slot.array().parse(await res.json()).map((s) => s.start);
}

// Pushes run in the background after the booking call; wait until one reached Google.
const pushTried = () => vi.waitFor(() => expect(google.state.requests.some((r) => r.path.includes("/events"))).toBe(true));

describe("tokens and state", () => {
  test("tokens are encrypted; a changed value or another key fails", () => {
    const stored = encrypt("refresh-secret", key);
    expect(stored).not.toContain("refresh-secret");
    expect(decrypt(stored, key)).toBe("refresh-secret");
    expect(() => decrypt(stored, Buffer.alloc(32, 8))).toThrow();
    expect(() => decrypt(`${stored.slice(0, -2)}AA`, key)).toThrow();
  });

  test("the OAuth state is signed and expires", () => {
    const state = signState({ userId: "jaka", locale: "sl", exp: now.getTime() + 1000 }, key);
    expect(verifyState(state, key, now)).toMatchObject({ userId: "jaka", locale: "sl" });
    expect(verifyState(state, Buffer.alloc(32, 8), now)).toBeNull();
    expect(verifyState(state, key, new Date(now.getTime() + 2000))).toBeNull();
    const forged = Buffer.from(JSON.stringify({ userId: "maja", locale: "sl", exp: now.getTime() + 1000 })).toString("base64url");
    expect(verifyState(`${forged}.${state.split(".")[1]}`, key, now)).toBeNull();
  });

  test("cut leaves the parts of a busy block outside the hole", () => {
    const t = (h: number) => new Date(Date.UTC(2026, 10, 2, h));
    expect(cut({ start: t(10), end: t(14) }, { start: t(11), end: t(12) })).toEqual([
      { start: t(10), end: t(11) },
      { start: t(12), end: t(14) },
    ]);
    expect(cut({ start: t(10), end: t(11) }, { start: t(10), end: t(11) })).toEqual([]);
    expect(cut({ start: t(10), end: t(11) }, { start: t(12), end: t(13) })).toEqual([{ start: t(10), end: t(11) }]);
  });
});

describe("connect", () => {
  test("without Google keys the feature is off, and booking works", async () => {
    vi.stubEnv("CALENDAR_TOKEN_KEY", "");
    as(people.jaka);
    expect(await status()).toEqual({ available: false, connection: null });
    expect(await errorCode(await send("POST", "/calendar/google/connect", { locale: "en" }))).toBe("calendar_off");
    await book();
    expect(google.state.requests).toEqual([]);
  });

  test("asks for offline access to calendar events and the calendar list, and comes back to /api/calendar/google/callback", async () => {
    as(people.jaka);
    const { url } = ConnectCalendar.parse(await (await send("POST", "/calendar/google/connect", { locale: "en" })).json());
    const params = new URL(url).searchParams;
    expect(url.startsWith(`${google.url}/o/oauth2/v2/auth?`)).toBe(true);
    expect(params.get("redirect_uri")).toBe("https://site.test/api/calendar/google/callback");
    expect(params.get("access_type")).toBe("offline");
    expect(params.get("scope")).toBe("https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly");
  });

  test("the callback stores encrypted tokens, picks the primary calendar and goes back to settings", async () => {
    expect(await connect()).toBe("https://site.test/sl/coach/settings/calendar?result=connected");
    const row = await connection();
    expect(row).toMatchObject({ coachId: ids.jakaCoachId, account: "jaka@example.com", calendarId: "jaka@example.com", status: "connected" });
    expect(row!.refreshToken).not.toContain("refresh-secret");
    expect(decrypt(row!.refreshToken, key)).toBe("refresh-secret");
    expect(row!.accessToken).not.toMatch(/^access-/);
    expect((await status()).connection).toMatchObject({ status: "connected", account: "jaka@example.com" });
  });

  test("refused, half-granted, forged or someone else's callbacks connect nothing", async () => {
    as(people.jaka);
    const { url } = ConnectCalendar.parse(await (await send("POST", "/calendar/google/connect", { locale: "en" })).json());
    const state = encodeURIComponent(new URL(url).searchParams.get("state")!);
    const back = async (query: string) => (await send("GET", `/calendar/google/callback?${query}`)).headers.get("location");

    expect(await back(`error=access_denied&state=${state}`)).toMatch(/result=denied$/);
    expect(await back(`code=bad-code&state=${state}`)).toMatch(/result=failed$/);
    expect(await back("code=good-code&state=forged.state")).toMatch(/result=failed$/);
    google.state.scope = "https://www.googleapis.com/auth/calendar.readonly";
    expect(await back(`code=good-code&state=${state}`)).toMatch(/result=scope$/);
    google.state.scope = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
    as(people.maja);
    expect(await back(`code=good-code&state=${state}`)).toMatch(/result=failed$/);
    expect(await connection()).toBeUndefined();
  });

  test("a customer or a user without a calendar can't connect", async () => {
    as(people.ana);
    expect((await send("POST", "/calendar/google/connect", { locale: "en" })).status).toBe(403);
    as(people.owner);
    expect(await errorCode(await send("GET", "/calendar"))).toBe("not_a_coach");
  });

  test("the coach picks another writable calendar for new bookings", async () => {
    await connect();
    const choices = CalendarChoice.array().parse(await (await send("GET", "/calendar/calendars")).json());
    expect(choices.map((c) => c.id)).toEqual(["jaka@example.com", "lab@group.calendar.google.com"]);
    expect(await errorCode(await send("PUT", "/calendar", { calendarId: "someone@else.com" }))).toBe("unknown_calendar");
    const res = await send("PUT", "/calendar", { calendarId: "lab@group.calendar.google.com" });
    expect(CalendarStatus.parse(await res.json()).connection).toMatchObject({ calendarId: "lab@group.calendar.google.com", calendarName: "Lab" });
    await vi.waitFor(() => expect(google.state.requests.some((r) => r.path.endsWith("/freeBusy"))).toBe(true));

    await book();
    await vi.waitFor(() => expect(google.live()).toHaveLength(1));
    expect(google.live()[0]![1].calendarId).toBe("lab@group.calendar.google.com");
  });

  test("disconnect deletes the tokens and asks Google to revoke them", async () => {
    await connect();
    expect((await send("DELETE", "/calendar")).status).toBe(204);
    expect(await connection()).toBeUndefined();
    expect(google.state.requests.at(-1)).toMatchObject({ path: "/revoke", body: "token=refresh-secret" });
    expect((await status()).connection).toBeNull();
  });
});

describe("push", () => {
  test("book → the event appears; move → it moves; cancel → it disappears", async () => {
    await connect();
    const booking = await book();
    await vi.waitFor(() => expect(google.live()).toHaveLength(1));
    const [id, event] = google.live()[0]!;
    expect(event.calendarId).toBe("jaka@example.com");
    expect(event.body).toMatchObject({ summary: "Ana · Performance package", start: { dateTime: monday16 } });

    as(people.jaka);
    expect((await send("POST", `/booking/coach/bookings/${booking.id}/reschedule`, { start: monday18 })).status).toBe(200);
    await vi.waitFor(() => expect(google.state.events.get(id)!.body.start).toEqual({ dateTime: monday18 }));

    expect((await send("POST", `/booking/coach/bookings/${booking.id}/cancel`, { reason: "Ill" })).status).toBe(200);
    await vi.waitFor(() => expect(google.live()).toHaveLength(0));
    expect(await database.select().from(calendarEvents)).toEqual([]);
  });

  test("the event holds the first name and the service only: no email, phone, last name or health answers", async () => {
    await connect();
    await book();
    await vi.waitFor(() => expect(google.live()).toHaveLength(1));
    const sent = google.state.requests.filter((r) => r.path.includes("/events")).map((r) => r.body);
    expect(sent.length).toBeGreaterThan(0);
    for (const body of sent) {
      for (const secret of ["ana.novak@example.com", "example.com", "555 123", "Marija", "Novak", "chest_pain", "beta blockers", "medication"]) {
        expect(body).not.toContain(secret);
      }
    }
    const fields = ["end", "extendedProperties", "id", "location", "start", "status", "summary"];
    expect(Object.keys(google.live()[0]![1].body).every((k) => fields.includes(k))).toBe(true);
  });

  test("a failing Google never fails the booking; the job pushes it later", async () => {
    await connect();
    google.state.failWith = 503;
    await book();
    await pushTried();
    expect(google.live()).toHaveLength(0);
    google.state.failWith = undefined;
    expect((await syncCalendars()).bookings).toBe(1);
    expect(google.live()).toHaveLength(1);
    // Nothing is pushed twice.
    expect((await syncCalendars()).bookings).toBe(0);
  });

  test("bookings made before connecting are pushed by the job", async () => {
    await book();
    await connect();
    await vi.waitFor(() => expect(google.live()).toHaveLength(1));
  });
});

describe("pull", () => {
  test("a private busy event at 16:00 makes the 16:00 slot unavailable after the job runs", async () => {
    await connect();
    await syncCalendars();
    expect(await slots()).toContain(monday16);
    google.state.busy = [{ start: monday16, end: "2026-11-02T16:00:00.000Z" }];
    await syncCalendars();
    expect(await slots()).not.toContain(monday16);
    // Booking it directly is refused too.
    as(null);
    const res = await send("POST", "/booking", {
      service: "performance",
      coachId: ids.jakaCoachId,
      start: monday16,
      name: "Bo",
      email: "bo@example.com",
      phone: "+386 41 000 000",
      locale: "en",
    });
    expect(res.status).toBe(409);
  });

  test("slots read busy times again on demand once they are 5 minutes old", async () => {
    await connect();
    await syncCalendars();
    google.state.busy = [{ start: monday16, end: "2026-11-02T16:00:00.000Z" }];
    expect(await slots()).toContain(monday16);
    vi.setSystemTime(new Date(now.getTime() + 5 * 60_000));
    expect(await slots()).not.toContain(monday16);
  });

  test("a booking being moved isn't blocked by its own event in Google", async () => {
    await connect();
    const booking = await book();
    await vi.waitFor(() => expect(google.live()).toHaveLength(1));
    // Google reports the booking's own event as busy.
    google.state.busy = [{ start: monday16, end: "2026-11-02T17:00:00.000Z" }];
    await syncCalendars();
    as(people.jaka);
    const res = await send("POST", `/booking/coach/bookings/${booking.id}/reschedule`, { start: "2026-11-02T15:30:00.000Z" });
    expect(res.status, await res.clone().text()).toBe(200);
  });
});

describe("revoked access", () => {
  test("the coach sees reconnect, and booking keeps working without sync", async () => {
    await connect();
    google.state.busy = [{ start: monday16, end: "2026-11-02T16:00:00.000Z" }];
    await syncCalendars();
    expect(await slots()).not.toContain(monday16);

    google.state.revoked = true;
    vi.setSystemTime(new Date(now.getTime() + 2 * 3600_000));
    await syncCalendars();
    as(people.jaka);
    expect((await status()).connection).toMatchObject({ status: "needs_reconnect" });
    expect(await errorCode(await send("GET", "/calendar/calendars"))).toBe("needs_reconnect");

    // Stale busy times no longer block, and a new booking goes through without touching Google.
    vi.setSystemTime(now);
    expect(await slots()).toContain(monday16);
    const before = google.state.requests.length;
    await book();
    expect((await syncCalendars()).bookings).toBe(0);
    expect(google.state.requests.length).toBe(before);

    // Connecting again brings sync back.
    google.state.revoked = false;
    await connect();
    await vi.waitFor(() => expect(google.live()).toHaveLength(1));
    expect((await status()).connection).toMatchObject({ status: "connected" });
  });

  test("a refused access token is refreshed once before giving up", async () => {
    await connect();
    google.state.accessTokens.clear();
    await book();
    await vi.waitFor(() => expect(google.live()).toHaveLength(1));
    expect((await connection())!.status).toBe("connected");
  });
});
