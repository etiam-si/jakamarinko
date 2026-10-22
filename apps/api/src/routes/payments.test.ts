import Stripe from "stripe";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiErrorBody, Booking, CheckoutSession, CreatedBooking, PaymentsInfo, Slot } from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import { bookings, refunds, stripeEvents } from "@jakamarinko/db/schema";
import { setTransport, type RenderedEmail } from "@jakamarinko/email";
import { app } from "../app";
import { bookingConfig } from "../booking/config";
import { people, seedFixtures, testDb } from "../booking/test-db";
import { logPaymentsStatus, paymentsConfig } from "../payments/config";
import { expireUnpaid } from "../payments/expire";
import { fakeStripe, type FakeStripe } from "../payments/fake-stripe";
import { refundDue } from "../payments/refunds";
import { setStripe } from "../payments/stripe";

const holder = vi.hoisted(() => ({ db: undefined as unknown, user: null as SessionUser | null }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));
vi.mock("@jakamarinko/auth", () => ({
  getSessionUser: async () => holder.user,
  hasConsent: async () => true,
}));

let database: Awaited<ReturnType<typeof testDb>>;
let ids: Awaited<ReturnType<typeof seedFixtures>>;
let fake: FakeStripe;
const outbox: RenderedEmail[] = [];
const secret = "whsec_test_secret";

// Sunday 1 November 2026, 13:00 in Ljubljana. Monday 16:00 is 27 h away, Wednesday 16:00 three days.
const now = new Date("2026-11-01T12:00:00Z");
const monday16 = "2026-11-02T15:00:00.000Z";
const wednesday16 = "2026-11-04T15:00:00.000Z";

const paymentsOn = () => {
  vi.stubEnv("PAYMENTS_ENABLED", "true");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
  vi.stubEnv("INVOICE_COMPANY_NAME", "Etiam d.o.o.");
  vi.stubEnv("INVOICE_COMPANY_ADDRESS", "Testna 1, 1000 Ljubljana");
  vi.stubEnv("INVOICE_VAT_ID", "SI12345678");
};

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
  await database.delete(refunds);
  await database.delete(bookings);
  await database.delete(stripeEvents);
  paymentsOn();
  fake = fakeStripe();
  setStripe(fake.client);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
  app.request(`/api${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
const errorCode = async (res: Response) => ApiErrorBody.parse(await res.json()).error.code;

async function book(overrides: Record<string, unknown> = {}) {
  const res = await call("POST", "/booking", {
    service: "performance",
    coachId: ids.jakaCoachId,
    start: monday16,
    name: "Ana Novak",
    email: "ana@example.com",
    phone: "+386 41 000 000",
    locale: "sl",
    ...overrides,
  });
  expect(res.status, await res.clone().text()).toBe(201);
  const created = CreatedBooking.parse(await res.json());
  return { ...created, token: new URL(created.manageUrl).searchParams.get("token")! };
}

async function checkout(bookingId: string, token?: string) {
  return call("POST", "/payments/checkout", { bookingId, token });
}

async function checkoutUrl(bookingId: string, token: string) {
  const res = await checkout(bookingId, token);
  expect(res.status, await res.clone().text()).toBe(200);
  return CheckoutSession.parse(await res.json()).url;
}

// What Stripe posts to the webhook, signed with the endpoint secret (or a wrong one).
function webhook(event: { id: string; type: string; object: unknown }, signWith = secret) {
  const payload = JSON.stringify({ id: event.id, object: "event", type: event.type, data: { object: event.object } });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: signWith });
  return call("POST", "/payments/stripe", payload, { "stripe-signature": header, "content-type": "application/json" });
}

const bookingRow = async (id: string) => (await database.select().from(bookings)).find((b) => b.id === id)!;

async function pay(bookingId: string, token: string, eventId = "evt_paid_1") {
  await checkoutUrl(bookingId, token);
  const { stripeCheckoutSessionId } = await bookingRow(bookingId);
  const res = await webhook({ id: eventId, type: "checkout.session.completed", object: fake.pay(stripeCheckoutSessionId!) });
  expect(res.status).toBe(200);
}

async function slots(day: string) {
  const res = await call("GET", `/booking/slots?service=performance&from=${day}&to=${day}`);
  return Slot.array().parse(await res.json()).map((s) => s.start);
}

describe("config", () => {
  test("payments are on only with PAYMENTS_ENABLED and both Stripe keys; the start log says what is missing", () => {
    const log = { log: vi.fn(), warn: vi.fn() };
    expect(paymentsConfig({ PAYMENTS_ENABLED: "true", STRIPE_SECRET_KEY: "sk_test_x" })).toMatchObject({
      enabled: false,
      off: "STRIPE_WEBHOOK_SECRET not set",
    });
    logPaymentsStatus(paymentsConfig({ PAYMENTS_ENABLED: "true" }), log);
    expect(log.warn).toHaveBeenCalledWith("payments off: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET not set; bookings are paid on site");
    logPaymentsStatus(paymentsConfig({ PAYMENTS_ENABLED: "true", STRIPE_SECRET_KEY: "pk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x" }), log);
    expect(log.warn).toHaveBeenLastCalledWith(expect.stringMatching(/^payments off: STRIPE_SECRET_KEY: must start with sk_test_/));
    logPaymentsStatus(paymentsConfig({ STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x" }), log);
    expect(log.log).toHaveBeenLastCalledWith("payments off: bookings are paid on site");
    logPaymentsStatus(paymentsConfig({ PAYMENTS_ENABLED: "true", STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x" }), log);
    expect(log.log).toHaveBeenLastCalledWith("payments on (Stripe test mode)");
    expect(paymentsConfig({}).pricesIncludeVat).toBe(true);
    expect(paymentsConfig({ PRICES_INCLUDE_VAT: "false" }).pricesIncludeVat).toBe(false);
  });

  test("without the keys, PAYMENTS_ENABLED=true keeps paying on site: confirmed at once, checkout and webhook are 503", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { booking } = await book();
    expect(booking).toMatchObject({ status: "confirmed", paidVia: "none" });
    expect(outbox).toHaveLength(2);
    expect(PaymentsInfo.parse(await (await call("GET", "/payments/config")).json())).toEqual({ enabled: false, pricesIncludeVat: true, holdMin: 15 });
    expect((await checkout(booking.id)).status).toBe(503);
    expect((await call("POST", "/payments/stripe", "{}")).status).toBe(503);
  });
});

describe("checkout", () => {
  test("a booking waits for payment; its Stripe page has the price, language, invoice details and the way back", async () => {
    const { booking, token, manageUrl } = await book();
    expect(booking).toMatchObject({ status: "pending_payment", paidVia: "none" });
    expect(outbox).toEqual([]);
    expect(PaymentsInfo.parse(await (await call("GET", "/payments/config")).json()).enabled).toBe(true);

    const url = await checkoutUrl(booking.id, token);
    expect(url).toMatch(/^https:\/\/checkout\.stripe\.test\/c\/pay\/cs_test_1$/);
    const [create] = fake.calls;
    expect(create).toMatchObject({ method: "POST", path: "/v1/checkout/sessions" });
    expect(create!.params).toMatchObject({
      mode: "payment",
      client_reference_id: booking.id,
      customer_email: "ana@example.com",
      locale: "sl",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][unit_amount]": "25000",
      "line_items[0][price_data][tax_behavior]": "inclusive",
      "line_items[0][price_data][product_data][name]": "Performance paket",
      "invoice_creation[enabled]": "true",
      "invoice_creation[invoice_data][footer]": "Etiam d.o.o., Testna 1, 1000 Ljubljana",
      "invoice_creation[invoice_data][custom_fields][0][name]": "ID za DDV",
      "invoice_creation[invoice_data][custom_fields][0][value]": "SI12345678",
      expires_at: String(now.getTime() / 1000 + 30 * 60),
      success_url: `${manageUrl}&confirmed=1&paid=1`,
      cancel_url: manageUrl,
    });
    expect(create!.params["line_items[0][price_data][product_data][description]"]).toMatch(/^ponedeljek, 2\. november 2026.*16:00, Lab$/);

    // A second click reuses the open page.
    expect(await checkoutUrl(booking.id, token)).toBe(url);
    expect(fake.sessions.size).toBe(1);
  });

  test("only the booking's owner or token gets a page, and only while it waits and the hold lasts", async () => {
    const { booking, token } = await book();
    expect((await checkout(booking.id)).status).toBe(404);
    expect((await checkout(booking.id, "wrong")).status).toBe(404);
    holder.user = people.ana;
    expect((await checkout(booking.id)).status).toBe(404); // a guest booking, not hers
    holder.user = null;

    vi.setSystemTime(new Date(now.getTime() + 15 * 60_000));
    expect(await errorCode(await checkout(booking.id, token))).toBe("hold_expired");

    vi.setSystemTime(now);
    vi.stubEnv("PAYMENTS_ENABLED", "false");
    const paidOnSite = await book({ start: wednesday16 });
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    expect(await errorCode(await checkout(paidOnSite.booking.id, paidOnSite.token))).toBe("not_pending");
  });

  test("prices without VAT are sent to Stripe as exclusive", async () => {
    vi.stubEnv("PRICES_INCLUDE_VAT", "false");
    const { booking, token } = await book({ locale: "en" });
    await checkoutUrl(booking.id, token);
    expect(fake.calls[0]!.params).toMatchObject({ "line_items[0][price_data][tax_behavior]": "exclusive", "invoice_creation[invoice_data][custom_fields][0][name]": "VAT ID" });
  });
});

describe("webhook", () => {
  test("a paid session confirms the booking, sends the emails and counts booking_paid on the server", async () => {
    vi.stubEnv("UMAMI_URL", "https://umami.test");
    vi.stubEnv("UMAMI_WEBSITE_ID", "site-1");
    const umami = vi.fn(async (_url: string, _init: RequestInit) => new Response("{}"));
    vi.stubGlobal("fetch", umami);

    const { booking, token } = await book();
    await pay(booking.id, token);

    const row = await bookingRow(booking.id);
    expect(row).toMatchObject({ status: "confirmed", paidVia: "stripe", stripePaymentIntentId: "pi_cs_test_1" });
    expect(outbox.map((e) => e.to)).toEqual(["ana@example.com", "ana@example.com"]);
    // Paid online: no "you pay on site".
    expect(outbox[0]!.text).not.toContain("Plačaš na kraju meritve");

    expect(umami).toHaveBeenCalledTimes(1);
    const [url, init] = umami.mock.calls[0]!;
    expect(url).toBe("https://umami.test/api/send");
    expect(JSON.parse(String(init.body))).toMatchObject({
      type: "event",
      payload: { website: "site-1", name: "booking_paid", data: { service: "performance", value: 250, currency: "EUR" } },
    });
    expect(String(init.body)).not.toContain("ana@example.com");

    const view = Booking.parse(await (await call("GET", `/booking/${booking.id}?token=${token}`)).json());
    expect(view).toMatchObject({ status: "confirmed", paidVia: "stripe" });
  });

  test("the same event replayed twice, and a second event for the same payment: one confirmation email", async () => {
    const { booking, token } = await book({ service: "personal-training" });
    await checkoutUrl(booking.id, token);
    const session = fake.pay((await bookingRow(booking.id)).stripeCheckoutSessionId!);
    const event = { id: "evt_1", type: "checkout.session.completed", object: session };
    const results = await Promise.all([webhook(event), webhook(event)]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect((await webhook(event)).status).toBe(200);
    expect((await webhook({ ...event, id: "evt_2", type: "checkout.session.async_payment_succeeded" })).status).toBe(200);
    expect(outbox).toHaveLength(1);
    expect((await database.select().from(stripeEvents)).map((e) => e.id).sort()).toEqual(["evt_1", "evt_2"]);
  });

  test("a forged webhook (bad or missing signature) is a 400 and changes nothing", async () => {
    const { booking, token } = await book();
    await checkoutUrl(booking.id, token);
    const session = fake.pay((await bookingRow(booking.id)).stripeCheckoutSessionId!);
    const forged = await webhook({ id: "evt_forged", type: "checkout.session.completed", object: session }, "whsec_attacker");
    expect(forged.status).toBe(400);
    expect(await errorCode(forged)).toBe("invalid_signature");
    const unsigned = await call("POST", "/payments/stripe", JSON.stringify({ id: "evt_x", type: "checkout.session.completed", data: { object: session } }));
    expect(unsigned.status).toBe(400);

    expect(await bookingRow(booking.id)).toMatchObject({ status: "pending_payment", paidVia: "none" });
    expect(await database.select().from(stripeEvents)).toEqual([]);
    expect(outbox).toEqual([]);
  });

  test("an expired Stripe page cancels the booking and frees the slot", async () => {
    const { booking, token } = await book();
    await checkoutUrl(booking.id, token);
    const id = (await bookingRow(booking.id)).stripeCheckoutSessionId!;
    fake.sessions.get(id)!.status = "expired";
    expect((await webhook({ id: "evt_exp", type: "checkout.session.expired", object: fake.view(id) })).status).toBe(200);
    expect((await bookingRow(booking.id)).status).toBe("cancelled");
    expect(await slots("2026-11-02")).toContain(monday16);
  });

  test("other events are acknowledged and ignored", async () => {
    expect((await webhook({ id: "evt_other", type: "customer.created", object: { id: "cus_1", object: "customer" } })).status).toBe(200);
  });
});

describe("expiry", () => {
  test("unpaid for 15 min: the booking expires, its Stripe page is closed and the slot is free again", async () => {
    const { booking, token } = await book();
    await checkoutUrl(booking.id, token);
    expect(await slots("2026-11-02")).not.toContain(monday16);

    expect(await expireUnpaid(new Date(now.getTime() + 14 * 60_000))).toBe(0);
    expect(await expireUnpaid(new Date(now.getTime() + 15 * 60_000))).toBe(1);
    expect(await bookingRow(booking.id)).toMatchObject({ status: "cancelled", cancelReason: "Not paid in time" });
    expect(fake.sessions.get("cs_test_1")!.status).toBe("expired");
    expect(await slots("2026-11-02")).toContain(monday16);
    // Run again: nothing left to do.
    expect(await expireUnpaid(new Date(now.getTime() + 16 * 60_000))).toBe(0);
  });

  test("with a shortened hold (PAYMENT_HOLD_MIN=1) a booking never sent to Stripe expires after a minute", async () => {
    vi.stubEnv("PAYMENT_HOLD_MIN", "1");
    const { booking } = await book();
    expect(await expireUnpaid(new Date(now.getTime() + 59_000))).toBe(0);
    expect(await expireUnpaid(new Date(now.getTime() + 60_000))).toBe(1);
    expect((await bookingRow(booking.id)).status).toBe("cancelled");
    expect(fake.calls).toEqual([]);
  });

  test("paid just before the hold ended but the webhook is late: the job confirms it instead", async () => {
    const { booking, token } = await book();
    await checkoutUrl(booking.id, token);
    fake.pay("cs_test_1");
    expect(await expireUnpaid(new Date(now.getTime() + 20 * 60_000))).toBe(0);
    expect(await bookingRow(booking.id)).toMatchObject({ status: "confirmed", paidVia: "stripe" });
    expect(outbox).toHaveLength(2);
  });

  test("paid after the booking expired: the payment is refunded and the customer told", async () => {
    const { booking, token } = await book();
    await checkoutUrl(booking.id, token);
    // Expired with Stripe unreachable for the expire call, so the page stayed payable.
    const id = (await bookingRow(booking.id)).stripeCheckoutSessionId!;
    await database.update(bookings).set({ status: "cancelled" });
    const res = await webhook({ id: "evt_late", type: "checkout.session.completed", object: fake.pay(id) });
    expect(res.status).toBe(200);
    expect(fake.refunds).toEqual([expect.objectContaining({ payment_intent: `pi_${id}`, "metadata[reason]": "late_payment" })]);
    expect(await database.select().from(refunds)).toEqual([expect.objectContaining({ bookingId: booking.id, reason: "late_payment", amountCents: 25000 })]);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.text).toContain("celoten znesek vrnemo");
  });
});

describe("refunds", () => {
  test("a customer cancels 3 days before: a full refund is created in Stripe, once", async () => {
    const { booking, token } = await book({ start: wednesday16, locale: "en" });
    await pay(booking.id, token);
    outbox.length = 0;

    const res = await call("POST", `/booking/${booking.id}/cancel?token=${token}`);
    expect(res.status).toBe(200);
    expect(fake.refunds).toEqual([expect.objectContaining({ payment_intent: "pi_cs_test_1", "metadata[booking_id]": booking.id })]);
    const refundCall = fake.calls.find((c) => c.path === "/v1/refunds")!;
    expect(refundCall.params.amount).toBeUndefined(); // no amount: the full payment
    expect(await database.select().from(refunds)).toEqual([
      expect.objectContaining({ bookingId: booking.id, stripeRefundId: "re_1", amountCents: 25000, reason: "customer_cancelled" }),
    ]);
    expect(outbox[0]!.text).toContain("the full amount will be refunded");
    expect((await call("POST", `/booking/${booking.id}/cancel?token=${token}`)).status).toBe(409);
    expect(fake.refunds).toHaveLength(1);
  });

  test("the coach cancels, even on the day: always a full refund", async () => {
    const { booking, token } = await book();
    await pay(booking.id, token);
    vi.setSystemTime(new Date("2026-11-02T13:00:00Z")); // 2 h before
    holder.user = people.jaka;
    const res = await call("POST", `/booking/coach/bookings/${booking.id}/cancel`, { reason: "Ill" });
    expect(res.status).toBe(200);
    expect(await database.select().from(refunds)).toEqual([expect.objectContaining({ reason: "coach_cancelled" })]);
  });

  test("an unpaid booking cancelled by the customer has its Stripe page closed, nothing refunded", async () => {
    const { booking, token } = await book();
    await checkoutUrl(booking.id, token);
    expect((await call("POST", `/booking/${booking.id}/cancel?token=${token}`)).status).toBe(200);
    expect(fake.sessions.get("cs_test_1")!.status).toBe("expired");
    expect(fake.refunds).toEqual([]);
  });

  test("the rule: customer 24 h or more before, coach always, unpaid never", async () => {
    const config = bookingConfig({});
    const row = (startAt: string, paidVia: "stripe" | "none" = "stripe") =>
      ({ booking: { paidVia, stripePaymentIntentId: "pi_1", startAt: new Date(startAt) } }) as Parameters<typeof refundDue>[0];
    expect(refundDue(row("2026-11-02T12:00:00Z"), "customer", now, config)).toBe(true); // exactly 24 h
    expect(refundDue(row("2026-11-02T11:59:00Z"), "customer", now, config)).toBe(false);
    expect(refundDue(row("2026-11-01T13:00:00Z"), "coach", now, config)).toBe(true);
    expect(refundDue(row("2026-11-04T12:00:00Z", "none"), "coach", now, config)).toBe(false);
  });
});
