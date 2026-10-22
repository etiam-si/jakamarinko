import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiErrorBody, CheckoutSession, CreatedBooking, Founding, GiftVoucher, OfferCode, OffersReport, Quote, Referral } from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import {
  bookings,
  conversions,
  foundingAthletes,
  offerCodes,
  offerRedemptions,
  offerSettings,
  refunds,
  serviceTypes,
  stripeEvents,
} from "@jakamarinko/db/schema";
import { setTransport, type RenderedEmail } from "@jakamarinko/email";
import { app } from "../app";
import { bookingConfig } from "../booking/config";
import { people, seedFixtures, testDb } from "../booking/test-db";
import { conversionReport } from "../conversions/report";
import { fakeStripe, type FakeStripe } from "../payments/fake-stripe";
import { setStripe } from "../payments/stripe";
import { newCode } from "./codes";
import { activateGift } from "./gifts";
import { bookingCompleted } from "./rewards";

const holder = vi.hoisted(() => ({ db: undefined as unknown, user: null as SessionUser | null }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));
vi.mock("@jakamarinko/auth", () => ({ getSessionUser: async () => holder.user, hasConsent: async () => true }));
const meta = vi.hoisted(() => ({ sent: [] as { name: string; value?: number }[] }));
vi.mock("../conversions/meta", () => ({
  reportConversion: async (c: { name: string; value?: number }) => {
    meta.sent.push(c);
    return "sent";
  },
}));
// Until the bundles are in the catalog (premium-site adds them, playbook §5.1): the season pack and the lactate
// retest as specified there. Once the catalog has them, the real entries are used.
vi.mock("@jakamarinko/types", async (importOriginal) => {
  const real = await importOriginal<typeof import("@jakamarinko/types")>();
  if ((real.labTestIds as readonly string[]).includes("lactate-retest")) return real;
  const text = { en: "fixture", sl: "fixture" };
  const list = { en: ["fixture"], sl: ["fixture"] };
  const extra = [
    { id: "season", kind: "lab_test", durationMin: 120, priceCents: 35000, name: { en: "Season pack", sl: "Sezonski paket" }, description: text, preparation: list, included: list, contains: ["vo2max", "lactate-profile", "fat-carb", "anthropometry"] },
    { id: "lactate-retest", kind: "lab_test", durationMin: 60, priceCents: 7000, name: { en: "Lactate retest", sl: "Ponovni laktatni test" }, description: text, preparation: list, included: list },
  ];
  return { ...real, labTestIds: [...real.labTestIds, "season", "lactate-retest"], labTests: [...real.labTests, ...extra] };
});

let database: Awaited<ReturnType<typeof testDb>>;
let ids: Awaited<ReturnType<typeof seedFixtures>>;
let fake: FakeStripe;
const outbox: RenderedEmail[] = [];
const secret = "whsec_test_secret";

// Sunday 1 November 2026, 13:00 in Ljubljana. 16:00 on the weekdays after it is free in the sample week.
const now = new Date("2026-11-01T12:00:00Z");
const at16 = { mon: "2026-11-02T15:00:00.000Z", tue: "2026-11-03T15:00:00.000Z", wed: "2026-11-04T15:00:00.000Z", thu: "2026-11-05T15:00:00.000Z", fri: "2026-11-06T15:00:00.000Z" };

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
  meta.sent.length = 0;
  for (const table of [offerRedemptions, offerCodes, foundingAthletes, offerSettings, conversions, refunds, stripeEvents, bookings]) {
    await database.delete(table);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const as = (user: SessionUser | null) => (holder.user = user);
const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
  app.request(`/api${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
const errorCode = async (res: Response) => ApiErrorBody.parse(await res.json()).error.code;

const bookingBody = (overrides: Record<string, unknown> = {}) => ({
  service: "lactate-profile",
  coachId: ids.jakaCoachId,
  start: at16.mon,
  name: "Ana Novak",
  email: "ana@example.com",
  phone: "+386 41 000 000",
  locale: "en",
  ...overrides,
});
const tryBook = (overrides: Record<string, unknown> = {}) => call("POST", "/booking", bookingBody(overrides));
async function book(overrides: Record<string, unknown> = {}) {
  const res = await tryBook(overrides);
  expect(res.status, await res.clone().text()).toBe(201);
  return CreatedBooking.parse(await res.json());
}

// As the owner, through the api.
async function createCode(body: Record<string, unknown>) {
  as(people.owner);
  const res = await call("POST", "/offers/codes", body);
  expect(res.status, await res.clone().text()).toBe(201);
  as(null);
  return OfferCode.parse(await res.json());
}

// The coach marks a booking completed, once its time has come.
async function complete(bookingId: string, start: string) {
  vi.setSystemTime(new Date(Date.parse(start) + 2 * 3_600_000));
  as(people.jaka);
  const res = await call("POST", `/booking/coach/bookings/${bookingId}/outcome`, { status: "completed" });
  as(null);
  return res;
}

const redemptionOf = async (bookingId: string) =>
  (await database.select().from(offerRedemptions).where(eq(offerRedemptions.bookingId, bookingId)))[0];

const founding = async () => Founding.parse(await (await call("GET", "/offers/founding")).json());

const paymentsOn = () => {
  vi.stubEnv("PAYMENTS_ENABLED", "true");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
  fake = fakeStripe();
  setStripe(fake.client);
};

function webhook(event: { id: string; type: string; object: unknown }) {
  const payload = JSON.stringify({ id: event.id, object: "event", type: event.type, data: { object: event.object } });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return call("POST", "/payments/stripe", payload, { "stripe-signature": header, "content-type": "application/json" });
}

describe("codes", () => {
  test("POST /offers/codes: owner 201, head coach 201, customer 403, guest 401; a taken code (any case) 409", async () => {
    const body = { code: "spring20", discountType: "percent", value: 20 };
    as(null);
    expect((await call("POST", "/offers/codes", body)).status).toBe(401);
    as(people.ana);
    expect((await call("POST", "/offers/codes", body)).status).toBe(403);
    as(people.maja);
    expect((await call("POST", "/offers/codes", body)).status).toBe(403);
    as(people.owner);
    const res = await call("POST", "/offers/codes", body);
    expect(res.status).toBe(201);
    expect(OfferCode.parse(await res.json())).toMatchObject({ code: "SPRING20", kind: "promo", discountType: "percent", value: 20, uses: 0 });
    const again = await call("POST", "/offers/codes", { ...body, code: "Spring20" });
    expect(again.status).toBe(409);
    expect(await errorCode(again)).toBe("code_taken");
    as(people.jaka);
    expect((await call("POST", "/offers/codes", { discountType: "fixed", value: 1500 })).status).toBe(201);
  });

  test("made-up codes have no look-alike characters (0/O, 1/I/L, 5/S)", () => {
    for (let i = 0; i < 200; i++) expect(newCode("JM")).toMatch(/^JM-[A-HJKMNP-RT-Z2-46-9]{4}-[A-HJKMNP-RT-Z2-46-9]{4}$/);
  });

  test("lactate profile (90 €) with a 20 % code: booked at 72 €, a redemption records 18 €; the code is case-insensitive", async () => {
    await createCode({ code: "SPRING20", discountType: "percent", value: 20 });
    const { booking } = await book({ code: " spring20 " });
    expect(booking).toMatchObject({ status: "confirmed", priceCents: 7200 });
    expect(await redemptionOf(booking.id)).toMatchObject({ listCents: 9000, savedCents: 1800, paidCents: 7200 });
    // The confirmation says what to pay on site.
    expect(outbox[0]!.text).toContain("You pay €72 on site");
  });

  test("a free code: confirmed at 0 € with nothing to pay, even with online payment on", async () => {
    paymentsOn();
    await createCode({ code: "FREETEST", discountType: "free", maxUses: 1 });
    const { booking } = await book({ code: "FREETEST" });
    expect(booking).toMatchObject({ status: "confirmed", paidVia: "none", priceCents: 0 });
    expect(fake.calls).toEqual([]);
    expect(outbox[0]!.text).toContain("There is nothing to pay.");
    expect(outbox[0]!.text).not.toContain("on site");
  });

  test("a fixed code never takes the price below 0", async () => {
    await createCode({ code: "BIG200", discountType: "fixed", value: 20000 });
    const { booking } = await book({ code: "BIG200" });
    expect(booking.priceCents).toBe(0);
    expect(await redemptionOf(booking.id)).toMatchObject({ listCents: 9000, savedCents: 9000, paidCents: 0 });
  });

  test("expired, used up, wrong service, wrong email or unknown: 422 with the reason, and no booking", async () => {
    await createCode({ code: "OLD10", discountType: "percent", value: 10, expiresAt: "2026-10-31T23:00:00Z" });
    await createCode({ code: "ONCE", discountType: "percent", value: 10, maxUses: 1 });
    await createCode({ code: "VO2ONLY", discountType: "percent", value: 10, services: ["vo2max"] });
    await createCode({ code: "FORBOR", discountType: "percent", value: 10, email: "Bor@Example.com" });
    await book({ code: "ONCE", start: at16.fri });

    const cases = [
      ["OLD10", "code_expired"],
      ["ONCE", "code_used_up"],
      ["VO2ONLY", "code_not_for_service"],
      ["FORBOR", "code_not_for_you"],
      ["NOPE-NOPE", "code_unknown"],
    ];
    for (const [code, expected] of cases) {
      const res = await tryBook({ code });
      expect(res.status, code).toBe(422);
      expect(await errorCode(res)).toBe(expected);
    }
    expect(await database.select().from(bookings)).toHaveLength(1);
    // The right email may use its code.
    expect((await tryBook({ code: "forbor", email: "bor@example.com" })).status).toBe(201);
  });

  test("a cancelled booking gives its use back", async () => {
    await createCode({ code: "ONCE", discountType: "percent", value: 10, maxUses: 1 });
    const { booking, manageUrl } = await book({ code: "ONCE" });
    expect(await errorCode(await tryBook({ code: "ONCE", start: at16.tue }))).toBe("code_used_up");
    const token = new URL(manageUrl).searchParams.get("token");
    expect((await call("POST", `/booking/${booking.id}/cancel?token=${token}`)).status).toBe(200);
    expect((await tryBook({ code: "ONCE", start: at16.tue })).status).toBe(201);
  });

  test("concurrency: a single-use code in 5 parallel bookings of different slots gives exactly 1 success", async () => {
    await createCode({ code: "ONLYONE", discountType: "free", maxUses: 1 });
    const results = await Promise.all(
      Object.values(at16).map((start, i) => tryBook({ code: "ONLYONE", start, email: `runner${i}@example.com` })),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 422, 422, 422, 422]);
    for (const r of results.filter((r) => r.status === 422)) expect(await errorCode(r)).toBe("code_used_up");
    expect(await database.select().from(bookings)).toHaveLength(1);
    expect(await database.select().from(offerRedemptions)).toHaveLength(1);
  });

  test("POST /offers/quote: the review's price, and why a code doesn't apply", async () => {
    await createCode({ code: "SPRING20", discountType: "percent", value: 20 });
    const quote = async (body: object) => Quote.parse(await (await call("POST", "/offers/quote", body)).json());
    expect(await quote({ service: "lactate-profile", code: "spring20" })).toMatchObject({
      listCents: 9000,
      priceCents: 7200,
      savedCents: 1800,
      source: "code",
      code: "SPRING20",
      codeError: null,
    });
    expect(await quote({ service: "lactate-profile", code: "WRONG" })).toMatchObject({ priceCents: 9000, codeError: "code_unknown", code: null });
    expect(await quote({ service: "lactate-profile" })).toMatchObject({ priceCents: 9000, source: null, retestEligible: true });
  });
});

describe("payments on", () => {
  test("Checkout charges the discounted 72 €, the refund returns what was paid, booking_paid is worth 72 €", async () => {
    paymentsOn();
    vi.stubEnv("META_PIXEL_ID", "1");
    vi.stubEnv("META_CAPI_TOKEN", "x");
    await createCode({ code: "SPRING20", discountType: "percent", value: 20 });
    const { booking, manageUrl } = await book({ code: "SPRING20", start: at16.wed });
    expect(booking).toMatchObject({ status: "pending_payment", priceCents: 7200 });
    const token = new URL(manageUrl).searchParams.get("token");
    const res = await call("POST", "/payments/checkout", { bookingId: booking.id, token });
    expect(res.status, await res.clone().text()).toBe(200);
    CheckoutSession.parse(await res.json());
    const create = fake.calls.find((c) => c.method === "POST" && c.path === "/v1/checkout/sessions")!;
    expect(create.params["line_items[0][price_data][unit_amount]"]).toBe("7200");

    const session = fake.pay([...fake.sessions.keys()][0]!);
    expect((await webhook({ id: "evt_paid", type: "checkout.session.completed", object: session })).status).toBe(200);
    expect(meta.sent).toEqual([expect.objectContaining({ name: "booking_paid", value: 72 })]);
    expect((await conversionReport({ from: "2026-11-01", to: "2026-11-01" })).total.revenueCents).toBe(7200);

    as(people.jaka);
    expect((await call("POST", `/booking/coach/bookings/${booking.id}/cancel`, {})).status).toBe(200);
    const [refund] = await database.select().from(refunds);
    expect(refund).toMatchObject({ bookingId: booking.id, amountCents: 7200 });
  });

  test("a confirmed booking without payment reports its discounted price as booking_paid", async () => {
    vi.stubEnv("META_PIXEL_ID", "1");
    vi.stubEnv("META_CAPI_TOKEN", "x");
    await createCode({ code: "SPRING20", discountType: "percent", value: 20 });
    await book({ code: "SPRING20" });
    expect(meta.sent).toEqual([expect.objectContaining({ name: "booking_paid", value: 72 })]);
  });
});

describe("referrals", () => {
  test("a friend's first booking through the link gets 10 € off; completing it gives the referrer one 10 € credit, once", async () => {
    as(people.ana);
    const referral = Referral.parse(await (await call("GET", "/offers/referral")).json());
    expect(referral.url).toMatch(new RegExp(`^http://localhost:\\d+/en/r/${referral.code}$`));
    expect(referral.credits).toEqual([]);
    // Asking again gives the same link.
    expect(Referral.parse(await (await call("GET", "/offers/referral")).json()).code).toBe(referral.code);
    as(null);

    const { booking } = await book({ code: referral.code.toLowerCase(), email: "friend@example.com", name: "Friend" });
    expect(booking.priceCents).toBe(8000);
    outbox.length = 0;

    expect((await complete(booking.id, at16.mon)).status).toBe(200);
    const credits = await database.select().from(offerCodes).where(eq(offerCodes.kind, "credit"));
    expect(credits).toHaveLength(1);
    expect(credits[0]).toMatchObject({ discountType: "fixed", value: 1000, email: "ana@example.com", ownerUserId: "ana", maxUses: 1 });
    expect(outbox.map((e) => [e.to, e.subject])).toEqual([["ana@example.com", "€10 credit for your next test"]]);
    expect(outbox[0]!.text).toContain(credits[0]!.code);

    // Completed again (the route says no; the hook itself makes nothing new either).
    expect((await complete(booking.id, at16.mon)).status).toBe(409);
    await bookingCompleted(booking.id, bookingConfig());
    expect(await database.select().from(offerCodes).where(eq(offerCodes.kind, "credit"))).toHaveLength(1);
    expect(outbox).toHaveLength(1);

    as(people.ana);
    const after = Referral.parse(await (await call("GET", "/offers/referral")).json());
    expect(after.credits).toEqual([{ code: credits[0]!.code, amountCents: 1000, used: false, expiresAt: expect.any(String) }]);
    as(null);
    // The credit works for Ana.
    const { booking: next } = await book({ code: credits[0]!.code, start: at16.wed });
    expect(next.priceCents).toBe(8000);
  });

  test("the referrer's own link and a friend's second booking get no discount", async () => {
    as(people.ana);
    const { code } = Referral.parse(await (await call("GET", "/offers/referral")).json());
    as(null);
    const own = await tryBook({ code, email: "ANA@example.com" });
    expect(own.status).toBe(422);
    expect(await errorCode(own)).toBe("code_not_for_you");

    await book({ email: "friend@example.com" });
    const second = await tryBook({ code, email: "friend@example.com", start: at16.tue });
    expect(await errorCode(second)).toBe("code_not_for_you");
    expect(await database.select().from(offerRedemptions)).toHaveLength(0);
  });

  test("GET /offers/referral needs a session", async () => {
    expect((await call("GET", "/offers/referral")).status).toBe(401);
  });
});

describe("founding athletes", () => {
  const seedFounders = (n: number) =>
    database.insert(foundingAthletes).values(Array.from({ length: n }, (_, i) => ({ email: `founder${i}@example.com`, number: i + 1 })));

  test("with 19, the 20th completed customer takes the last place, the counter shows 0, the 21st gets nothing", async () => {
    await seedFounders(19);
    expect(await founding()).toEqual({ enabled: true, places: 20, taken: 19, left: 1 });
    const twentieth = await book({ email: "twentieth@example.com" });
    expect((await complete(twentieth.booking.id, at16.mon)).status).toBe(200);
    expect(await database.select().from(foundingAthletes).where(eq(foundingAthletes.email, "twentieth@example.com"))).toEqual([
      expect.objectContaining({ number: 20 }),
    ]);
    expect(await founding()).toMatchObject({ taken: 20, left: 0 });

    const st = await book({ email: "twentyfirst@example.com", start: at16.thu });
    expect((await complete(st.booking.id, at16.thu)).status).toBe(200);
    expect(await database.select().from(foundingAthletes)).toHaveLength(20);
    expect(await founding()).toMatchObject({ taken: 20, left: 0 });
  });

  test("a founding customer's next 90 € booking costs 63 €; with a 20 % code still 63 € (the larger saving wins)", async () => {
    await database.insert(foundingAthletes).values({ email: "ana@example.com", number: 1 });
    vi.setSystemTime(now);
    const plain = await book({ email: "Ana@Example.com" });
    expect(plain.booking.priceCents).toBe(6300);
    expect(await redemptionOf(plain.booking.id)).toMatchObject({ codeId: null, savedCents: 2700 });

    const code = await createCode({ code: "SPRING20", discountType: "percent", value: 20, maxUses: 1 });
    const coded = await book({ code: "SPRING20", start: at16.tue });
    expect(coded.booking.priceCents).toBe(6300);
    // The code wasn't needed, so it isn't used up.
    expect((await database.select().from(offerRedemptions).where(eq(offerRedemptions.codeId, code.id)))).toHaveLength(0);
    // A free code saves more than 30 %.
    await createCode({ code: "ALLFREE", discountType: "free" });
    expect((await book({ code: "ALLFREE", start: at16.wed })).booking.priceCents).toBe(0);
  });

  test("the owner switches the offer off: no counter, no new places; head coach may not", async () => {
    as(people.jaka);
    expect((await call("PUT", "/offers/founding", { enabled: false })).status).toBe(403);
    as(people.owner);
    const res = await call("PUT", "/offers/founding", { enabled: false });
    expect(Founding.parse(await res.json())).toEqual({ enabled: false, places: 20, taken: 0, left: 0 });
    as(null);
    const b = await book();
    await complete(b.booking.id, at16.mon);
    expect(await database.select().from(foundingAthletes)).toHaveLength(0);
  });
});

describe("lactate retest", () => {
  async function pastLactate(daysAgo: number, status: "completed" | "confirmed" = "completed") {
    const [service] = await database.select().from(serviceTypes).where(eq(serviceTypes.catalogId, "performance"));
    const start = new Date(now.getTime() - daysAgo * 86_400_000);
    await database.insert(bookings).values({
      serviceTypeId: service!.id,
      coachId: ids.jakaCoachId,
      locationId: ids.labId,
      customerName: "Ana",
      customerEmail: "ana@example.com",
      customerPhone: "+386 41 000 000",
      startAt: start,
      endAt: new Date(start.getTime() + 3_600_000),
      status,
      locale: "en",
      manageToken: "t",
    });
  }

  test("without a completed lactate test in 120 days: 422 retest_not_eligible", async () => {
    await pastLactate(130);
    await pastLactate(10, "confirmed");
    const res = await tryBook({ service: "lactate-retest" });
    expect(res.status).toBe(422);
    expect(await errorCode(res)).toBe("retest_not_eligible");
    const quote = Quote.parse(await (await call("POST", "/offers/quote", { service: "lactate-retest", email: "ana@example.com" })).json());
    expect(quote.retestEligible).toBe(false);
  });

  test("with one completed 30 days ago (a package with lactate): booked at 70 €", async () => {
    await pastLactate(30);
    const { booking } = await book({ service: "lactate-retest" });
    expect(booking).toMatchObject({ service: "lactate-retest", priceCents: 7000 });
  });
});

describe("season pack", () => {
  test("the confirmation email has 2 distinct single-use codes for the lactate retest only, for 6 months, for the buyer", async () => {
    const { booking } = await book({ service: "season", email: "Sezona@Example.com" });
    const codes = await database.select().from(offerCodes).where(and(eq(offerCodes.kind, "season_retest"), eq(offerCodes.bookingId, booking.id)));
    expect(codes).toHaveLength(2);
    expect(new Set(codes.map((c) => c.code)).size).toBe(2);
    for (const c of codes) {
      expect(c).toMatchObject({ discountType: "free", services: ["lactate-retest"], maxUses: 1, email: "sezona@example.com" });
      expect(c.expiresAt!.toISOString()).toBe("2027-05-01T12:00:00.000Z");
    }
    const confirmation = outbox.find((e) => e.attachments?.length)!;
    for (const c of codes) expect(confirmation.text).toContain(c.code);

    // Not for anything else, not for anyone else; for the retest it stands in for the earlier test.
    expect(await errorCode(await tryBook({ code: codes[0]!.code, email: "sezona@example.com", start: at16.tue }))).toBe("code_not_for_service");
    expect(await errorCode(await tryBook({ service: "lactate-retest", code: codes[0]!.code, start: at16.tue }))).toBe("code_not_for_you");
    const retest = await book({ service: "lactate-retest", code: codes[0]!.code, email: "sezona@example.com", start: at16.tue });
    expect(retest.booking.priceCents).toBe(0);
  });
});

describe("gift vouchers", () => {
  test("the owner makes a voucher worth 50 € or a service; its page shows the value; a customer may not", async () => {
    as(people.ana);
    expect((await call("POST", "/offers/gifts", { amountCents: 5000 })).status).toBe(403);
    as(people.owner);
    const money = OfferCode.parse(await (await call("POST", "/offers/gifts", { amountCents: 5000, recipientName: "Maja" })).json());
    const test = OfferCode.parse(await (await call("POST", "/offers/gifts", { service: "lactate-profile" })).json());
    expect(money.code).toMatch(/^GIFT-/);
    as(null);
    const page = async (code: string, locale = "en") => GiftVoucher.parse(await (await call("GET", `/offers/gift/${code.toLowerCase()}?locale=${locale}`)).json());
    expect(await page(money.code)).toMatchObject({ amountCents: 5000, service: null, recipientName: "Maja", used: false });
    expect(await page(test.code, "sl")).toMatchObject({ amountCents: null, service: "lactate-profile", serviceName: "Laktatni profil" });
    expect((await call("GET", "/offers/gift/NOPE-NOPE")).status).toBe(404);

    const { booking } = await book({ code: test.code });
    expect(booking.priceCents).toBe(0);
    expect((await page(test.code)).used).toBe(true);
  });

  test("buying online: off without payments; on, a Checkout page for the voucher, switched on once paid", async () => {
    const body = { amountCents: 9000, buyerEmail: "buyer@example.com", recipientName: "Maja", locale: "en" };
    const off = await call("POST", "/offers/gifts/checkout", body);
    expect(off.status).toBe(503);
    expect(await errorCode(off)).toBe("payments_off");

    paymentsOn();
    expect((await call("POST", "/offers/gifts/checkout", body)).status).toBe(200);
    const create = fake.calls.find((c) => c.path === "/v1/checkout/sessions")!;
    expect(create.params["line_items[0][price_data][unit_amount]"]).toBe("9000");
    const [row] = await database.select().from(offerCodes).where(eq(offerCodes.kind, "gift"));
    expect(row).toMatchObject({ active: false, value: 9000, discountType: "fixed" });
    // Not shown before it's paid.
    expect((await call("GET", `/offers/gift/${row!.code}`)).status).toBe(404);

    const paid = { id: row!.stripeCheckoutSessionId, payment_status: "paid", customer_email: "buyer@example.com", metadata: { gift_code_id: row!.id, locale: "en" } } as unknown as Stripe.Checkout.Session;
    expect(await activateGift(paid, bookingConfig())).toBe(true);
    await activateGift(paid, bookingConfig());
    expect(outbox.map((e) => e.subject)).toEqual(["Your gift voucher: €90"]);
    expect((await call("GET", `/offers/gift/${row!.code}`)).status).toBe(200);
  });
});

describe("give a free test", () => {
  test("the owner gives Ana a free lactate profile: a single-use free code for her email, emailed with a book link", async () => {
    as(people.owner);
    const res = await call("POST", "/offers/free-test", { name: "Ana", email: "Ana@Example.com", service: "lactate-profile", locale: "sl" });
    expect(res.status).toBe(201);
    const [row] = await database.select().from(offerCodes).where(eq(offerCodes.kind, "free_test"));
    expect(row).toMatchObject({ discountType: "free", services: ["lactate-profile"], maxUses: 1, email: "ana@example.com", recipientName: "Ana" });
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ to: "Ana@Example.com", locale: "sl" });
    expect(outbox[0]!.html).toContain(`/sl/booking?service=lactate-profile&amp;code=${row!.code}`);
    as(null);
    expect((await book({ code: row!.code })).booking.priceCents).toBe(0);
    expect(await errorCode(await tryBook({ code: row!.code, start: at16.tue }))).toBe("code_used_up");
  });

  test("only owner and head coach", async () => {
    as(people.maja);
    expect((await call("POST", "/offers/free-test", { name: "A", email: "a@example.com", service: "vo2max", locale: "en" })).status).toBe(403);
  });
});

describe("the offers report", () => {
  test("codes with their uses, revenue and discounts for bookings made in the range", async () => {
    await createCode({ code: "SPRING20", discountType: "percent", value: 20 });
    await book({ code: "SPRING20" });
    await book({ code: "SPRING20", start: at16.tue, email: "bor@example.com" });
    await database.insert(foundingAthletes).values({ email: "cene@example.com", number: 1 });
    await book({ start: at16.wed, email: "cene@example.com" });

    as(people.jaka);
    const report = OffersReport.parse(await (await call("GET", "/offers/report?from=2026-11-01&to=2026-11-01")).json());
    expect(report.codes.find((c) => c.code === "SPRING20")).toMatchObject({ uses: 2, period: { redemptions: 2, revenueCents: 14400, discountCents: 3600 } });
    expect(report.foundingPeriod).toEqual({ redemptions: 1, revenueCents: 6300, discountCents: 2700 });
    expect(report.totals).toEqual({ redemptions: 3, revenueCents: 20700, discountCents: 6300 });
    expect(report.founding).toMatchObject({ taken: 1, left: 19 });

    const empty = OffersReport.parse(await (await call("GET", "/offers/report?from=2026-10-01&to=2026-10-31")).json());
    expect(empty.totals).toEqual({ redemptions: 0, revenueCents: 0, discountCents: 0 });
    as(people.maja);
    expect((await call("GET", "/offers/report?from=2026-11-01&to=2026-11-01")).status).toBe(403);
  });
});
