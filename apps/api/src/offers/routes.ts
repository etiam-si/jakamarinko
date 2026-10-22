import { and, count, desc, eq, gte, inArray, lt, notInArray, or, sql, sum } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  CreateCodeInput,
  FoundingInput,
  FreeTestInput,
  GiftCheckoutInput,
  GiftInput,
  OffersReportQuery,
  QuoteInput,
  UpdateCodeInput,
  offerRules,
  type Founding,
  type GiftCheckout,
  type GiftVoucher,
  type OfferCode,
  type OffersReport,
  type Quote,
  type Referral,
} from "@jakamarinko/api";
import { db } from "@jakamarinko/db";
import { bookings, offerCodes, offerRedemptions, serviceTypes, users } from "@jakamarinko/db/schema";
import { sendEmail } from "@jakamarinko/email";
import { locales, type Locale } from "@jakamarinko/types";
import { serviceName } from "../booking/catalog";
import { bookingConfig } from "../booking/config";
import { addDays, zoned } from "../booking/time";
import { requireRole, requireSession } from "../lib/auth";
import { ApiError } from "../lib/errors";
import { validate } from "../lib/validate";
import { paymentsConfig } from "../payments/config";
import { codeView, insertCode, newCode, normalizeCode, usesOf } from "./codes";
import { foundingStatus, setFoundingEnabled } from "./founding";
import { confirmGift, giftCheckout, voucherView, yearLater } from "./gifts";
import { quote } from "./pricing";

const managers = requireRole("head_coach");
const IdParam = z.object({ id: z.uuid() });
const CodeParam = z.object({ code: z.string().max(40) });
const LocaleQuery = z.object({ locale: z.enum(locales).default("en") });

async function listPrice(catalogId: string) {
  const [service] = await db()
    .select({ priceCents: serviceTypes.priceCents })
    .from(serviceTypes)
    .where(and(eq(serviceTypes.catalogId, catalogId), eq(serviceTypes.active, true)));
  if (!service) throw new ApiError(404, "unknown_service", "Service not found");
  return service.priceCents;
}

// The signed-in customer's personal referral code, made on first ask.
async function referralCode(userId: string) {
  const mine = () => db().select().from(offerCodes).where(and(eq(offerCodes.kind, "referral"), eq(offerCodes.ownerUserId, userId)));
  for (let i = 0; i < 5; i++) {
    const [found] = await mine();
    if (found) return found;
    await db()
      .insert(offerCodes)
      .values({ code: newCode(), kind: "referral", discountType: "fixed", value: offerRules.referralCents, ownerUserId: userId })
      .onConflictDoNothing();
  }
  throw new Error("could not make a referral code");
}

const zero = { redemptions: 0, revenueCents: 0, discountCents: 0 };

// Bookings made in the range that used a code or the founding discount, per code (null: founding).
async function period(from: string, to: string) {
  const rows = await db()
    .select({
      codeId: offerRedemptions.codeId,
      redemptions: count(),
      revenueCents: sql<number>`coalesce(${sum(offerRedemptions.paidCents)}, 0)::int`,
      discountCents: sql<number>`coalesce(${sum(offerRedemptions.savedCents)}, 0)::int`,
    })
    .from(offerRedemptions)
    .innerJoin(bookings, eq(bookings.id, offerRedemptions.bookingId))
    .where(
      and(
        notInArray(bookings.status, ["cancelled", "pending_payment"]),
        gte(bookings.createdAt, zoned(from, 0)),
        lt(bookings.createdAt, zoned(addDays(to, 1), 0)),
      ),
    )
    .groupBy(offerRedemptions.codeId);
  return new Map(rows.map(({ codeId, ...r }) => [codeId, r]));
}

export const offers = new Hono()
  // Public: how many founding places are left, for the counter on the site.
  .get("/founding", async (c) => {
    c.header("cache-control", "no-store");
    return c.json<Founding>(await foundingStatus());
  })
  .put("/founding", requireRole("owner"), validate("json", FoundingInput), async (c) => {
    await setFoundingEnabled(c.req.valid("json").enabled);
    return c.json<Founding>(await foundingStatus());
  })
  // Public: the price at the review step. A bad code isn't an error here; the answer says why.
  .post("/quote", validate("json", QuoteInput), async (c) => {
    const input = c.req.valid("json");
    const listCents = await listPrice(input.service);
    return c.json<Quote>(await quote(db(), { ...input, listCents, now: new Date() }));
  })
  .post("/codes", managers, validate("json", CreateCodeInput), async (c) => {
    const { code, email, ...input } = c.req.valid("json");
    const values = {
      ...input,
      kind: "promo" as const,
      email: email?.toLowerCase() ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdByUserId: c.get("user").id,
    };
    if (!code) return c.json<OfferCode>(codeView(await insertCode(db(), values), 0), 201);
    const [row] = await db().insert(offerCodes).values({ ...values, code }).onConflictDoNothing().returning();
    if (!row) throw new ApiError(409, "code_taken", "This code already exists");
    return c.json<OfferCode>(codeView(row, 0), 201);
  })
  .patch("/codes/:id", managers, validate("param", IdParam), validate("json", UpdateCodeInput), async (c) => {
    const [row] = await db().update(offerCodes).set(c.req.valid("json")).where(eq(offerCodes.id, c.req.valid("param").id)).returning();
    if (!row) throw new ApiError(404, "not_found", "Code not found");
    return c.json<OfferCode>(codeView(row, await usesOf(db(), row.id)));
  })
  // "Give a free test": a single-use free code for that email and service, emailed with a book link.
  .post("/free-test", managers, validate("json", FreeTestInput), async (c) => {
    const input = c.req.valid("json");
    await listPrice(input.service);
    const row = await insertCode(
      db(),
      {
        kind: "free_test",
        discountType: "free",
        services: [input.service],
        maxUses: 1,
        email: input.email.toLowerCase(),
        recipientName: input.name,
        note: input.note || null,
        createdByUserId: c.get("user").id,
      },
      "FREE",
    );
    const bookUrl = `${bookingConfig().siteUrl}/${input.locale}/booking?service=${input.service}&code=${encodeURIComponent(row.code)}`;
    const sent = await sendEmail({
      to: input.email,
      locale: input.locale,
      template: "offerFreeTest",
      props: { name: input.name, code: row.code, serviceName: serviceName(input.service, input.locale), bookUrl },
    });
    return c.json({ ...codeView(row, 0), emailed: sent.ok }, 201);
  })
  // A gift voucher made by the owner: printed or forwarded from its page.
  .post("/gifts", managers, validate("json", GiftInput), async (c) => {
    const input = c.req.valid("json");
    if (input.service) await listPrice(input.service);
    const row = await insertCode(
      db(),
      {
        kind: "gift",
        discountType: input.service ? "free" : "fixed",
        value: input.amountCents ?? 0,
        services: input.service ? [input.service] : null,
        maxUses: 1,
        expiresAt: yearLater(new Date()),
        recipientName: input.recipientName || null,
        note: input.note || null,
        createdByUserId: c.get("user").id,
      },
      "GIFT",
    );
    return c.json<OfferCode>(codeView(row, 0), 201);
  })
  // Buying a voucher online, only with online payment on. Without it the voucher page says to get in touch.
  .post("/gifts/checkout", validate("json", GiftCheckoutInput), async (c) => {
    const payments = paymentsConfig();
    if (!payments.enabled) throw new ApiError(503, "payments_off", "Online payment is not available");
    return c.json<GiftCheckout>({ url: await giftCheckout(c.req.valid("json"), new Date(), payments, bookingConfig()) });
  })
  .get("/gift/:code", validate("param", CodeParam), validate("query", LocaleQuery), async (c) => {
    const [found] = await db()
      .select()
      .from(offerCodes)
      .where(and(eq(offerCodes.code, normalizeCode(c.req.valid("param").code)), eq(offerCodes.kind, "gift")));
    const row = found && (await confirmGift(found, bookingConfig()));
    if (!row?.active) throw new ApiError(404, "not_found", "Voucher not found");
    return c.json<GiftVoucher>(await voucherView(row, c.req.valid("query").locale));
  })
  .get("/referral", requireSession, async (c) => {
    const user = c.get("user");
    const row = await referralCode(user.id);
    const credits = await db()
      .select()
      .from(offerCodes)
      .where(and(eq(offerCodes.kind, "credit"), eq(offerCodes.ownerUserId, user.id)))
      .orderBy(desc(offerCodes.createdAt));
    const [me] = await db().select({ locale: users.locale }).from(users).where(eq(users.id, user.id));
    const locale: Locale = me?.locale ?? "en";
    return c.json<Referral>({
      code: row.code,
      url: `${bookingConfig().siteUrl}/${locale}/r/${row.code}`,
      credits: await Promise.all(
        credits.map(async (r) => ({
          code: r.code,
          amountCents: r.value,
          used: (await usesOf(db(), r.id)) >= (r.maxUses ?? Infinity),
          expiresAt: r.expiresAt?.toISOString() ?? null,
        })),
      ),
    });
  })
  // The offers page: every code made in the coach area and every one used in the range, with totals.
  .get("/report", managers, validate("query", OffersReportQuery), async (c) => {
    const { from, to } = c.req.valid("query");
    const used = await period(from, to);
    const usedIds = [...used.keys()].filter((id): id is string => !!id);
    const rows = await db()
      .select()
      .from(offerCodes)
      .where(
        or(inArray(offerCodes.kind, ["promo", "free_test", "gift"]), usedIds.length ? inArray(offerCodes.id, usedIds) : sql`false`),
      )
      .orderBy(desc(offerCodes.createdAt));
    const codes = await Promise.all(rows.map(async (r) => ({ ...codeView(r, await usesOf(db(), r.id)), period: used.get(r.id) ?? zero })));
    const totals = [...used.values()].reduce(
      (t, p) => ({
        redemptions: t.redemptions + p.redemptions,
        revenueCents: t.revenueCents + p.revenueCents,
        discountCents: t.discountCents + p.discountCents,
      }),
      zero,
    );
    return c.json<OffersReport>({ codes, foundingPeriod: used.get(null) ?? zero, totals, founding: await foundingStatus() });
  });
