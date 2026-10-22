import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiErrorBody, Booking, CoachBooking, CreatedBooking, Service, Slot } from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import { bookings } from "@jakamarinko/db/schema";
import { setTransport, type RenderedEmail } from "@jakamarinko/email";
import { app } from "../app";
import { people, seedFixtures, testDb } from "../booking/test-db";

const holder = vi.hoisted(() => ({ db: undefined as unknown, user: null as SessionUser | null }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));
vi.mock("@jakamarinko/auth", () => ({
  getSessionUser: async () => holder.user,
  hasConsent: async () => true,
}));

let database: Awaited<ReturnType<typeof testDb>>;
let ids: Awaited<ReturnType<typeof seedFixtures>>;
const outbox: RenderedEmail[] = [];

// Sunday 1 November 2026, 13:00 in Ljubljana. Monday 16:00 is 27 h away, so it can be booked.
const now = new Date("2026-11-01T12:00:00Z");
const monday16 = "2026-11-02T15:00:00.000Z";

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
});

afterEach(() => vi.useRealTimers());
afterAll(() => vi.unstubAllEnvs());

const as = (user: SessionUser | null) => (holder.user = user);
const send = (method: string, path: string, body?: unknown) =>
  app.request(`/api/booking${path}`, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const errorCode = async (res: Response) => ApiErrorBody.parse(await res.json()).error.code;

const guest = (overrides: Record<string, unknown> = {}) => ({
  service: "performance",
  coachId: ids.jakaCoachId,
  start: monday16,
  name: "Ana Novak",
  email: "Ana@Example.com",
  phone: "+386 41 000 000",
  locale: "en",
  ...overrides,
});

async function book(overrides: Record<string, unknown> = {}) {
  const res = await send("POST", "", guest(overrides));
  expect(res.status, await res.clone().text()).toBe(201);
  return CreatedBooking.parse(await res.json());
}

async function slots(service: string, from: string, to = from) {
  const res = await send("GET", `/slots?service=${service}&from=${from}&to=${to}`);
  expect(res.status).toBe(200);
  return Slot.array().parse(await res.json());
}

describe("public", () => {
  test("GET /services lists the catalog's bookable items in the asked language", async () => {
    const res = await send("GET", "/services?locale=sl");
    const services = Service.array().parse(await res.json());
    expect(services.map((s) => s.id)).toEqual([
      "vo2max",
      "lactate-profile",
      "vo2max-lactate",
      "fat-carb",
      "running-economy",
      "anthropometry",
      "performance",
      "personal-training",
    ]);
    expect(services.find((s) => s.id === "performance")).toMatchObject({ name: "Performance paket", priceCents: 25000, durationMin: 120 });
    expect(services.find((s) => s.id === "personal-training")!.preparation).toEqual([]);
  });

  test("GET /slots: the sample week of the head coach, in UTC", async () => {
    const monday = await slots("vo2max", "2026-11-02");
    expect(monday[0]).toEqual({
      start: monday16,
      end: "2026-11-02T15:45:00.000Z",
      coachId: ids.jakaCoachId,
      locationId: ids.labId,
    });
    expect(await slots("vo2max", "2026-11-08")).toEqual([]); // Sunday
  });

  test("GET /slots rejects an unknown service and a range over 62 days", async () => {
    expect((await send("GET", "/slots?service=yoga&from=2026-11-02&to=2026-11-02")).status).toBe(400);
    expect((await send("GET", "/slots?service=vo2max&from=2026-11-02&to=2027-02-02")).status).toBe(400);
  });

  test("a guest books: confirmed, paid on site, confirmation and preparation emails in their language", async () => {
    const { booking, manageUrl } = await book({ locale: "sl" });
    expect(booking).toMatchObject({ status: "confirmed", paidVia: "none", start: monday16, end: "2026-11-02T17:00:00.000Z" });
    expect(booking.email).toBe("ana@example.com");
    expect(manageUrl).toMatch(new RegExp(`^http://localhost:\\d+/sl/booking/${booking.id}\\?token=[\\w-]{32}$`));

    expect(outbox.map((e) => [e.to, e.locale])).toEqual([
      ["ana@example.com", "sl"],
      ["ana@example.com", "sl"],
    ]);
    const [confirmation, preparation] = outbox;
    expect(confirmation!.subject).toMatch(/Performance paket/);
    expect(confirmation!.text).toContain("Plačaš na kraju meritve");
    expect(confirmation!.attachments?.[0]?.content).toContain("DTSTART;TZID=Europe/Ljubljana:20261102T160000");
    // The Performance package contains the fat/carb test, so the customer comes fasted.
    expect(preparation!.text).toContain("na tešče");
  });

  test("a session gets a confirmation but no lab preparation email", async () => {
    await book({ service: "personal-training" });
    expect(outbox).toHaveLength(1);
  });

  test("a booked time is gone from the slots, with the 15 min buffer around it", async () => {
    await book({ service: "vo2max" }); // 16:00–16:45
    const starts = (await slots("vo2max", "2026-11-02")).map((s) => s.start);
    expect(starts).not.toContain(monday16);
    expect(starts).not.toContain("2026-11-02T15:30:00.000Z"); // 16:30 overlaps
    expect(starts[0]).toBe("2026-11-02T16:00:00.000Z"); // 17:00 is after 16:45 + 15 min
  });

  test("booking a taken or unavailable time is a 409", async () => {
    await book();
    const again = await send("POST", "", guest({ email: "bo@example.com" }));
    expect(again.status).toBe(409);
    expect(await errorCode(again)).toBe("slot_taken");

    const sunday = await send("POST", "", guest({ start: "2026-11-08T15:00:00.000Z" }));
    expect(await errorCode(sunday)).toBe("slot_taken");
    // Less than 24 h ahead.
    vi.setSystemTime(new Date("2026-11-01T16:00:00Z"));
    expect(await errorCode(await send("POST", "", guest({ start: monday16, service: "vo2max" })))).toBe("slot_taken");
  });

  test("10 parallel bookings of the same slot: exactly 1 succeeds, 9 get 409", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => send("POST", "", guest({ email: `p${i}@example.com` }))),
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, ...Array(9).fill(409)]);
    expect(await database.select().from(bookings)).toHaveLength(1);
  });

  test("input is validated: health answers need consent, bad email and phone are rejected", async () => {
    expect((await send("POST", "", guest({ healthAnswers: { chest_pain: false } }))).status).toBe(400);
    expect((await send("POST", "", guest({ email: "nope" }))).status).toBe(400);
    expect((await send("POST", "", guest({ phone: "1" }))).status).toBe(400);
    expect((await send("POST", "", guest({ coachId: "not-a-uuid" }))).status).toBe(400);
  });

  test("with payments on, a paid service waits for payment and sends no email yet", async () => {
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    const { booking } = await book();
    vi.unstubAllEnvs();
    expect(booking).toMatchObject({ status: "pending_payment", paidVia: "none" });
    expect(outbox).toEqual([]);
  });
});

describe("customer", () => {
  test("a customer sees only their own bookings", async () => {
    as(people.ana);
    const { booking } = await book();
    expect(Booking.array().parse(await (await send("GET", "/mine")).json()).map((b) => b.id)).toEqual([booking.id]);
    expect((await send("GET", `/${booking.id}`)).status).toBe(200);

    as(people.bo);
    expect(await (await send("GET", "/mine")).json()).toEqual([]);
    const other = await send("GET", `/${booking.id}`);
    expect(other.status).toBe(404);
    expect((await send("POST", `/${booking.id}/cancel`)).status).toBe(404);

    as(null);
    expect((await send("GET", "/mine")).status).toBe(401);
    expect((await send("GET", `/${booking.id}`)).status).toBe(404);
  });

  test("a guest opens and cancels with the token from the email link, not without it", async () => {
    const { booking, manageUrl } = await book();
    const token = new URL(manageUrl).searchParams.get("token")!;
    expect((await send("GET", `/${booking.id}?token=wrong`)).status).toBe(404);
    expect((await send("GET", `/${booking.id}?token=${token}`)).status).toBe(200);

    outbox.length = 0;
    const res = await send("POST", `/${booking.id}/cancel?token=${token}`);
    expect(res.status).toBe(200);
    expect(Booking.parse(await res.json())).toMatchObject({ status: "cancelled", cancellable: false });
    expect(outbox.map((e) => e.subject)).toEqual([expect.stringMatching(/^Booking cancelled: Performance package/)]);
    expect(outbox[0]!.text).not.toContain("refunded");

    // The slot is free again.
    expect((await slots("performance", "2026-11-02")).map((s) => s.start)).toContain(monday16);
    expect(await errorCode(await send("POST", `/${booking.id}/cancel?token=${token}`))).toBe("not_active");
  });

  test("free cancellation ends 24 h before the start", async () => {
    as(people.ana);
    const { booking } = await book();
    vi.setSystemTime(new Date("2026-11-01T15:30:00Z")); // 23.5 h before
    expect(Booking.parse(await (await send("GET", `/${booking.id}`)).json()).cancellable).toBe(false);
    const res = await send("POST", `/${booking.id}/cancel`);
    expect(res.status).toBe(409);
    expect(await errorCode(res)).toBe("too_late");
  });
});

describe("coach", () => {
  const availabilityOf = async (coachId: string) =>
    (await (await send("GET", `/coach/availability?coachId=${coachId}`)).json()) as { id: string; weekday: number }[];

  test("customers and guests can't reach the coach routes", async () => {
    expect((await send("GET", "/coach/availability")).status).toBe(401);
    as(people.ana);
    expect((await send("GET", "/coach/availability")).status).toBe(403);
  });

  test("a coach edits their own availability, but not another coach's", async () => {
    as(people.maja);
    const created = await send("POST", "/coach/availability", { weekday: 7, start: "10:00", end: "12:00", locationId: ids.labId });
    expect(created.status).toBe(201);
    const own = (await created.json()) as { id: string };
    expect((await send("PUT", `/coach/availability/${own.id}`, { weekday: 7, start: "10:00", end: "13:00", locationId: ids.labId })).status).toBe(200);
    expect((await send("DELETE", `/coach/availability/${own.id}`)).status).toBe(204);

    as(people.jaka);
    const jakas = await availabilityOf(ids.jakaCoachId);
    expect(jakas).toHaveLength(6);

    as(people.maja);
    const target = jakas[0]!.id;
    const body = { weekday: 1, start: "08:00", end: "09:00", locationId: ids.labId };
    expect((await send("GET", `/coach/availability?coachId=${ids.jakaCoachId}`)).status).toBe(403);
    expect((await send("POST", "/coach/availability", { ...body, coachId: ids.jakaCoachId })).status).toBe(403);
    expect((await send("PUT", `/coach/availability/${target}`, body)).status).toBe(403);
    expect((await send("DELETE", `/coach/availability/${target}`)).status).toBe(403);
    expect((await send("POST", "/coach/exceptions", { coachId: ids.jakaCoachId, startDate: "2026-11-02", endDate: "2026-11-02", kind: "closed" })).status).toBe(403);

    as(people.jaka);
    expect(await availabilityOf(ids.jakaCoachId)).toHaveLength(6);
  });

  test("a head coach edits anyone's availability", async () => {
    as(people.jaka);
    const created = await send("POST", "/coach/availability", {
      coachId: ids.majaCoachId,
      weekday: 7,
      start: "10:00",
      end: "12:00",
      locationId: ids.labId,
    });
    expect(created.status).toBe(201);
    const row = (await created.json()) as { id: string; coachId: string };
    expect(row.coachId).toBe(ids.majaCoachId);
    expect((await send("PUT", `/coach/availability/${row.id}`, { weekday: 6, start: "10:00", end: "12:00", locationId: ids.labId })).status).toBe(200);
    expect((await send("DELETE", `/coach/availability/${row.id}`)).status).toBe(204);
  });

  test("a coach without a calendar must name one; validation names the field", async () => {
    as(people.owner);
    expect(await errorCode(await send("GET", "/coach/availability"))).toBe("not_a_coach");
    expect((await send("GET", `/coach/availability?coachId=${ids.jakaCoachId}`)).status).toBe(200);
    as(people.jaka);
    const bad = await send("POST", "/coach/availability", { weekday: 1, start: "18:00", end: "17:00", locationId: ids.labId });
    expect(bad.status).toBe(400);
  });

  test("closing a day with an exception removes its slots; deleting it brings them back", async () => {
    as(people.jaka);
    const res = await send("POST", "/coach/exceptions", { startDate: "2026-11-02", endDate: "2026-11-02", kind: "closed", note: "Race" });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    expect(await slots("vo2max", "2026-11-02")).toEqual([]);
    expect((await slots("vo2max", "2026-11-03")).length).toBeGreaterThan(0);

    expect((await send("DELETE", `/coach/exceptions/${id}`)).status).toBe(204);
    expect((await slots("vo2max", "2026-11-02")).length).toBeGreaterThan(0);
  });

  test("open hours on a Sunday add slots", async () => {
    as(people.jaka);
    const res = await send("POST", "/coach/exceptions", { startDate: "2026-11-08", endDate: "2026-11-08", kind: "open", start: "10:00", end: "11:00" });
    expect(res.status).toBe(201);
    expect((await slots("vo2max", "2026-11-08")).map((s) => [s.start, s.locationId])).toEqual([["2026-11-08T09:00:00.000Z", ids.labId]]);
    expect((await send("POST", "/coach/exceptions", { startDate: "2026-11-08", endDate: "2026-11-08", kind: "open" })).status).toBe(400);
  });

  test("the booking list: the own coach sees health answers, other staff only the flag", async () => {
    await book({ healthAnswers: { chest_pain: true, medication: "none" }, healthConsent: true });
    const list = async () => CoachBooking.array().parse(await (await send("GET", `/coach/bookings?coachId=${ids.jakaCoachId}&from=2026-11-02&to=2026-11-02`)).json());

    as(people.jaka);
    expect((await list())[0]).toMatchObject({ healthFlag: true, healthAnswers: { chest_pain: true, medication: "none" } });
    as(people.owner);
    expect((await list())[0]).toMatchObject({ healthFlag: true, healthAnswers: null });
    as(people.maja);
    expect((await send("GET", `/coach/bookings?coachId=${ids.jakaCoachId}&from=2026-11-02&to=2026-11-02`)).status).toBe(403);
    expect(await (await send("GET", "/coach/bookings?from=2026-11-02&to=2026-11-02")).json()).toEqual([]);
  });

  test("the coach cancels with a reason (any time), and the customer is emailed", async () => {
    const { booking } = await book();
    vi.setSystemTime(new Date("2026-11-02T14:00:00Z")); // an hour before
    outbox.length = 0;
    as(people.maja);
    expect((await send("POST", `/coach/bookings/${booking.id}/cancel`, { reason: "Ill" })).status).toBe(403);
    as(people.jaka);
    const res = await send("POST", `/coach/bookings/${booking.id}/cancel`, { reason: "Coach is ill" });
    expect(CoachBooking.parse(await res.json())).toMatchObject({ status: "cancelled", cancelReason: "Coach is ill" });
    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.text).toContain("Reason: Coach is ill");
  });

  test("the coach reschedules to a free slot; the customer gets the new time and .ics", async () => {
    const { booking } = await book({ service: "vo2max" });
    await book({ service: "vo2max", start: "2026-11-03T15:00:00.000Z", email: "bo@example.com" });
    outbox.length = 0;
    as(people.jaka);
    const taken = await send("POST", `/coach/bookings/${booking.id}/reschedule`, { start: "2026-11-03T15:00:00.000Z" });
    expect(await errorCode(taken)).toBe("slot_taken");
    // 30 min later on the same day overlaps itself only, which doesn't count.
    const res = await send("POST", `/coach/bookings/${booking.id}/reschedule`, { start: "2026-11-02T15:30:00.000Z" });
    expect(res.status).toBe(200);
    expect(CoachBooking.parse(await res.json()).start).toBe("2026-11-02T15:30:00.000Z");
    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.subject).toBe("Booking moved: VO₂max test, Monday 2 November");
    expect(outbox[0]!.text).toContain("Previous time: Monday 2 November, 16:00");
    const ics = outbox[0]!.attachments![0]!.content;
    expect(ics).toContain("DTSTART;TZID=Europe/Ljubljana:20261102T163000");
    expect(ics).toContain(`UID:${booking.id}@jakamarinko.com`);
    expect(ics).toMatch(/SEQUENCE:[1-9]\d*\r\n/);
  });

  test("reschedule slots: the booking's coach and length, ignoring the notice and the booking itself", async () => {
    const { booking } = await book({ service: "vo2max" });
    vi.setSystemTime(new Date("2026-11-02T13:00:00Z")); // Monday 14:00, two hours before
    const path = `/coach/bookings/${booking.id}/slots?from=2026-11-02&to=2026-11-02`;
    as(people.maja);
    expect((await send("GET", path)).status).toBe(403);
    as(people.jaka);
    const free = Slot.array().parse(await (await send("GET", path)).json());
    expect(free[0]).toEqual({ start: monday16, end: "2026-11-02T15:45:00.000Z", coachId: ids.jakaCoachId, locationId: ids.labId });
    expect((await send("GET", `/coach/bookings/${booking.id}/slots?from=2026-11-02&to=2027-02-02`)).status).toBe(400);
  });

  test("coaches for the switcher: coach ids (not user ids), own first; a coach sees only their own", async () => {
    expect((await send("GET", "/coach/coaches")).status).toBe(401);
    as(people.ana);
    expect((await send("GET", "/coach/coaches")).status).toBe(403);
    as(people.jaka);
    expect(await (await send("GET", "/coach/coaches")).json()).toEqual([
      { id: ids.jakaCoachId, name: "jaka", own: true },
      { id: ids.majaCoachId, name: "maja", own: false },
    ]);
    as(people.maja);
    expect(await (await send("GET", "/coach/coaches")).json()).toEqual([{ id: ids.majaCoachId, name: "maja", own: true }]);
  });

  test("locations are listed for staff, the default first", async () => {
    expect((await send("GET", "/coach/locations")).status).toBe(401);
    as(people.maja);
    expect(await (await send("GET", "/coach/locations")).json()).toEqual([
      { id: ids.labId, name: "Lab", address: "Testna 1, Ljubljana", isDefault: true },
    ]);
  });

  test("health answers: a head coach looking at another coach's booking sees only the flag", async () => {
    as(people.maja);
    await send("POST", "/coach/availability", { weekday: 2, start: "08:00", end: "12:00", locationId: ids.labId });
    as(null);
    const { booking } = await book({
      service: "vo2max",
      coachId: ids.majaCoachId,
      start: "2026-11-03T07:00:00.000Z",
      healthAnswers: { chest_pain: true },
      healthConsent: true,
    });
    const list = async () =>
      CoachBooking.array().parse(await (await send("GET", `/coach/bookings?coachId=${ids.majaCoachId}&from=2026-11-03&to=2026-11-03`)).json());
    as(people.maja);
    expect((await list())[0]).toMatchObject({ id: booking.id, healthAnswers: { chest_pain: true } });
    as(people.jaka);
    expect((await list())[0]).toMatchObject({ id: booking.id, healthFlag: true, healthAnswers: null });
  });

  test("completed and no-show only after the start", async () => {
    const { booking } = await book();
    as(people.jaka);
    expect(await errorCode(await send("POST", `/coach/bookings/${booking.id}/outcome`, { status: "completed" }))).toBe("not_started");
    vi.setSystemTime(new Date("2026-11-02T18:00:00Z"));
    const res = await send("POST", `/coach/bookings/${booking.id}/outcome`, { status: "no_show" });
    expect(CoachBooking.parse(await res.json()).status).toBe("no_show");
  });
});
