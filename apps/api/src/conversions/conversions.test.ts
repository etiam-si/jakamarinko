import { createHash } from "node:crypto";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { ConversionReport, CreatedBooking } from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import { bookings, conversions, requests, serviceTypes } from "@jakamarinko/db/schema";
import { setTransport } from "@jakamarinko/email";
import { app } from "../app";
import { people, seedFixtures, testDb } from "../booking/test-db";
import { resetRateLimit } from "../routes/requests";
import { reportConversion } from "./meta";
import { reportBookingPaid } from "./record";

const holder = vi.hoisted(() => ({ db: undefined as unknown, user: null as SessionUser | null }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));
vi.mock("@jakamarinko/auth", () => ({
  getSessionUser: async () => holder.user,
  hasConsent: async () => true,
}));

let database: Awaited<ReturnType<typeof testDb>>;
let ids: Awaited<ReturnType<typeof seedFixtures>>;

// The mocked Meta endpoint: every request the api makes to the Graph API lands here.
type MetaCall = { url: string; body: { data: Record<string, any>[]; test_event_code?: string; access_token: string } };
const meta: MetaCall[] = [];
let metaStatus = 200;
const fakeFetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
  meta.push({ url: String(url), body: JSON.parse(String(init?.body)) });
  return new Response("{}", { status: metaStatus });
});

const now = new Date("2026-11-01T12:00:00Z");
const monday16 = "2026-11-02T15:00:00.000Z";
const hash = (email: string) => createHash("sha256").update(email).digest("hex");
const consent = (marketing: boolean) => `jm_consent=${encodeURIComponent(JSON.stringify({ v: 1, analytics: false, marketing }))}`;
const browser = { "user-agent": "Mozilla/5.0 test", "cf-connecting-ip": "203.0.113.9", referer: "https://jakamarinko.com/en/lp/lactate-test" };

beforeAll(async () => {
  database = await testDb();
  holder.db = database;
  ids = await seedFixtures();
  setTransport(async () => ({ ok: true, id: "1" }));
});

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"], now });
  vi.stubGlobal("fetch", fakeFetch);
  vi.stubEnv("META_PIXEL_ID", "123");
  vi.stubEnv("META_CAPI_TOKEN", "secret");
  vi.stubEnv("META_TEST_EVENT_CODE", "TEST42");
  vi.stubEnv("HEAD_COACH_EMAIL", people.jaka.email);
  meta.length = 0;
  metaStatus = 200;
  holder.user = null;
  resetRateLimit();
  await database.delete(conversions);
  await database.delete(bookings);
  await database.delete(requests);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const post = (path: string, body: unknown, cookie = "") =>
  app.request(`/api${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, ...browser },
    body: JSON.stringify(body),
  });

const contact = { name: "Ana Novak", email: "Ana@Example.com", phone: "", topic: "lab_test", message: "Hi", locale: "en", consent: true };
const booking = (overrides: Record<string, unknown> = {}) => ({
  service: "performance",
  coachId: ids.jakaCoachId,
  start: monday16,
  name: "Ana Novak",
  email: "Ana@Example.com",
  phone: "+386 41 000 000",
  locale: "en",
  ...overrides,
});

describe("reportConversion", () => {
  const conversion = { name: "booking_paid" as const, eventId: "booking_paid-1", email: " Ana@Example.com ", value: 250 };
  const config = { pixelId: "123", token: "secret" };

  test("sends nothing without marketing consent, even with keys", async () => {
    expect(await reportConversion({ ...conversion, marketingConsent: false }, config)).toBe("skipped");
    expect(meta).toEqual([]);
  });

  test("is off without the pixel id or the token", async () => {
    expect(await reportConversion({ ...conversion, marketingConsent: true }, null)).toBe("off");
    vi.stubEnv("META_CAPI_TOKEN", "");
    expect(await reportConversion({ ...conversion, marketingConsent: true })).toBe("off");
    expect(meta).toEqual([]);
  });

  test("sends a Purchase with the hashed email and the shared event id", async () => {
    expect(await reportConversion({ ...conversion, marketingConsent: true }, config)).toBe("sent");
    expect(meta).toHaveLength(1);
    expect(meta[0]!.url).toBe("https://graph.facebook.com/v23.0/123/events");
    expect(meta[0]!.body.access_token).toBe("secret");
    expect(meta[0]!.body.data[0]).toMatchObject({
      event_name: "Purchase",
      event_id: "booking_paid-1",
      action_source: "website",
      user_data: { em: [hash("ana@example.com")] },
      custom_data: { value: 250, currency: "EUR" },
    });
    expect(JSON.stringify(meta[0]!.body)).not.toContain("example.com");
  });

  test("a refusal or no answer is failed, never an exception", async () => {
    metaStatus = 400;
    expect(await reportConversion({ ...conversion, marketingConsent: true }, config)).toBe("failed");
    fakeFetch.mockRejectedValueOnce(new Error("timeout"));
    expect(await reportConversion({ ...conversion, marketingConsent: true }, config)).toBe("failed");
  });
});

describe("contact_sent", () => {
  test("without marketing consent no server event is sent", async () => {
    for (const cookie of ["", consent(false), "jm_consent=broken", `jm_consent=${encodeURIComponent('{"v":0,"marketing":true}')}`]) {
      const res = await post("/requests", contact, cookie);
      expect(res.status).toBe(200);
    }
    expect(meta).toEqual([]);
    const rows = await database.select().from(conversions);
    expect(rows.map((r) => [r.status, r.marketingConsent, r.client])).toEqual(Array(4).fill(["skipped", false, null]));
  });

  test("with marketing consent one Contact event goes to the mocked Meta endpoint, with the id the pixel uses", async () => {
    const res = await post("/requests", contact, `${consent(true)}; _fbp=fb.1.1.42`);
    const { eventId } = (await res.json()) as { eventId: string };
    const [request] = await database.select().from(requests);
    expect(eventId).toBe(`contact_sent-${request!.id}`);
    expect(meta).toHaveLength(1);
    expect(meta[0]!.body.test_event_code).toBe("TEST42");
    expect(meta[0]!.body.data[0]).toMatchObject({
      event_name: "Contact",
      event_id: eventId,
      event_source_url: browser.referer,
      user_data: { em: [hash("ana@example.com")], fbp: "fb.1.1.42", client_ip_address: "203.0.113.9", client_user_agent: "Mozilla/5.0 test" },
    });
    expect(meta[0]!.body.data[0]!.custom_data).toBeUndefined();
    // Once sent, the device details are gone.
    const [row] = await database.select().from(conversions);
    expect(row).toMatchObject({ status: "sent", marketingConsent: true, client: null });
  });

  test("without Meta keys the form still works and nothing is sent", async () => {
    vi.stubEnv("META_CAPI_TOKEN", "");
    expect((await post("/requests", contact, consent(true))).status).toBe(200);
    expect(meta).toEqual([]);
    expect((await database.select().from(conversions))[0]!.status).toBe("off");
  });

  test("a Meta failure does not fail the form", async () => {
    metaStatus = 500;
    expect((await post("/requests", contact, consent(true))).status).toBe(200);
    expect((await database.select().from(conversions))[0]!.status).toBe("failed");
  });
});

describe("booking_paid", () => {
  test("a booking confirmed right away (paid on site) sends one Purchase with its price", async () => {
    const res = await post("/booking", booking({ utm: { utm_source: "instagram", fbclid: "abc" } }), consent(true));
    expect(res.status).toBe(201);
    const { booking: b } = CreatedBooking.parse(await res.json());
    expect(meta).toHaveLength(1);
    expect(meta[0]!.body.data[0]).toMatchObject({
      event_name: "Purchase",
      event_id: `booking_paid-${b.id}`,
      custom_data: { value: 250, currency: "EUR" },
      user_data: { em: [hash("ana@example.com")], fbc: `fb.1.${now.getTime()}.abc` },
    });
  });

  test("without marketing consent a booking sends nothing", async () => {
    expect((await post("/booking", booking(), consent(false))).status).toBe(201);
    expect(meta).toEqual([]);
  });

  test("with online payment it waits for the payment, then reports once however often it is called", async () => {
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_x");
    const { booking: b } = CreatedBooking.parse(await (await post("/booking", booking(), consent(true))).json());
    expect(b.status).toBe("pending_payment");
    expect(meta).toEqual([]);
    expect((await database.select().from(conversions))[0]).toMatchObject({ status: "pending", marketingConsent: true });

    await reportBookingPaid(b.id);
    await reportBookingPaid(b.id); // a replayed webhook
    expect(meta).toHaveLength(1);
    expect(meta[0]!.body.data[0]!.event_id).toBe(`booking_paid-${b.id}`);
  });

  test("a booking from before conversions were recorded is ignored", async () => {
    await reportBookingPaid("00000000-0000-4000-8000-000000000000");
    expect(meta).toEqual([]);
  });
});

describe("GET /api/conversions/report", () => {
  const get = (query: string) => app.request(`/api/conversions/report${query}`);

  // Bookings straight in the database: what matters is source, status, price and when it was made.
  async function seed() {
    const services = await database.select().from(serviceTypes);
    const price = (id: string) => services.find((s) => s.catalogId === id)!;
    const rows: [string, string, Record<string, string> | null, (typeof bookings.$inferInsert)["status"], number][] = [
      ["performance", "2026-10-05T10:00:00Z", { utm_source: "instagram", utm_campaign: "autumn" }, "confirmed", 0],
      ["vo2max", "2026-10-06T10:00:00Z", { utm_source: "instagram", utm_campaign: "autumn" }, "completed", 1],
      ["lactate-profile", "2026-10-07T10:00:00Z", { utm_source: "instagram", utm_campaign: "winter" }, "no_show", 2],
      ["vo2max", "2026-10-08T10:00:00Z", { utm_source: "google", utm_campaign: "autumn" }, "confirmed", 3],
      ["vo2max", "2026-10-09T10:00:00Z", null, "confirmed", 4],
      ["performance", "2026-10-10T10:00:00Z", { utm_source: "instagram", utm_campaign: "autumn" }, "cancelled", 5],
      ["performance", "2026-10-11T10:00:00Z", { utm_source: "instagram", utm_campaign: "autumn" }, "pending_payment", 6],
      // 1 November 00:30 in Ljubljana: outside a range that ends on 31 October.
      ["performance", "2026-10-31T23:30:00Z", { utm_source: "instagram", utm_campaign: "autumn" }, "confirmed", 7],
      // 1 October 00:30 in Ljubljana (UTC still 30 September): inside a range from 1 October.
      ["anthropometry", "2026-09-30T22:30:00Z", { utm_source: "google", utm_campaign: "autumn" }, "confirmed", 8],
    ];
    await database.insert(bookings).values(
      rows.map(([service, createdAt, utm, status, i]) => ({
        serviceTypeId: price(service).id,
        coachId: ids.jakaCoachId,
        locationId: ids.labId,
        customerName: `C${i}`,
        customerEmail: `c${i}@example.com`,
        customerPhone: "+386 41 000 000",
        startAt: new Date(Date.parse("2026-12-01T09:00:00Z") + i * 7_200_000),
        endAt: new Date(Date.parse("2026-12-01T10:00:00Z") + i * 7_200_000),
        status,
        utm,
        locale: "en" as const,
        manageToken: `t${i}`,
        createdAt: new Date(createdAt),
      })),
    );
  }

  test("only the owner sees it", async () => {
    expect((await get("?from=2026-10-01&to=2026-10-31")).status).toBe(401);
    holder.user = people.jaka;
    expect((await get("?from=2026-10-01&to=2026-10-31")).status).toBe(403);
  });

  test("matches the database for a seeded set of bookings", async () => {
    await seed();
    holder.user = people.owner;
    const res = await get("?from=2026-10-01&to=2026-10-31");
    expect(res.status).toBe(200);
    const report = ConversionReport.parse(await res.json());
    expect(report.rows).toEqual([
      { source: "instagram", campaign: "autumn", bookings: 2, revenueCents: 25000 + 9000 },
      { source: "google", campaign: "autumn", bookings: 2, revenueCents: 9000 + 5000 },
      { source: "instagram", campaign: "winter", bookings: 1, revenueCents: 9000 },
      // Bookings without a source come last among equals.
      { source: null, campaign: null, bookings: 1, revenueCents: 9000 },
    ]);
    expect(report.total).toEqual({ bookings: 6, revenueCents: 66000 });

    // Recomputed straight from the rows: every counted booking in the range, at its service's price.
    const all = await database.select().from(bookings);
    const services = await database.select().from(serviceTypes);
    const inRange = all.filter(
      (b) =>
        ["confirmed", "completed", "no_show"].includes(b.status) &&
        b.createdAt >= new Date("2026-09-30T22:00:00Z") &&
        b.createdAt < new Date("2026-10-31T23:00:00Z"),
    );
    const revenue = inRange.reduce((sum, b) => sum + services.find((s) => s.id === b.serviceTypeId)!.priceCents, 0);
    expect(report.total).toEqual({ bookings: inRange.length, revenueCents: revenue });
  });

  test("rejects a backwards or too long range", async () => {
    holder.user = people.owner;
    expect((await get("?from=2026-10-31&to=2026-10-01")).status).toBe(400);
    expect((await get("?from=2025-01-01&to=2026-10-01")).status).toBe(400);
  });
});
