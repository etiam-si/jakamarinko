import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import type { GiftCheckoutInput, GiftVoucher } from "@jakamarinko/api";
import { db } from "@jakamarinko/db";
import { offerCodes, serviceTypes } from "@jakamarinko/db/schema";
import { sendEmail } from "@jakamarinko/email";
import type { Locale } from "@jakamarinko/types";
import type { BookingConfig } from "../booking/config";
import { serviceName } from "../booking/catalog";
import { ApiError } from "../lib/errors";
import type { PaymentsConfig } from "../payments/config";
import { stripe } from "../payments/stripe";
import { insertCode, usesOf, type CodeRow } from "./codes";

const voucherName = { en: "Gift voucher", sl: "Darilni bon" } as const;
const intl = { en: "en-GB", sl: "sl-SI" } as const;
const validMonths = 12;

export const yearLater = (now: Date) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() + validMonths);
  return d;
};

const voucherUrl = (code: string, locale: Locale, config: BookingConfig) => `${config.siteUrl}/${locale}/gift/${encodeURIComponent(code)}`;

// A voucher is worth an amount (fixed) or one service (free for that service).
export const giftValue = (row: Pick<CodeRow, "discountType" | "value" | "services">) =>
  row.discountType === "fixed" ? { amountCents: row.value, service: null } : { amountCents: null, service: row.services?.[0] ?? null };

export async function voucherView(row: CodeRow, locale: Locale): Promise<GiftVoucher> {
  const { amountCents, service } = giftValue(row);
  const used = row.maxUses !== null && (await usesOf(db(), row.id)) >= row.maxUses;
  const [price] = service
    ? await db().select({ cents: serviceTypes.priceCents }).from(serviceTypes).where(eq(serviceTypes.catalogId, service))
    : [];
  return {
    code: row.code,
    amountCents,
    valueCents: amountCents ?? price?.cents ?? 0,
    service,
    serviceName: service ? serviceName(service, locale) : null,
    recipientName: row.recipientName,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    used,
  };
}

// Buying a voucher online: an inactive code and a Stripe Checkout page for its price. It's switched on once paid.
export async function giftCheckout(input: GiftCheckoutInput, now: Date, payments: PaymentsConfig, config: BookingConfig) {
  let priceCents = input.amountCents ?? 0;
  if (input.service) {
    const [service] = await db()
      .select({ priceCents: serviceTypes.priceCents })
      .from(serviceTypes)
      .where(and(eq(serviceTypes.catalogId, input.service), eq(serviceTypes.active, true)));
    if (!service) throw new ApiError(404, "unknown_service", "Service not found");
    priceCents = service.priceCents;
  }
  const row = await insertCode(
    db(),
    {
      kind: "gift",
      discountType: input.service ? "free" : "fixed",
      value: input.service ? 0 : priceCents,
      services: input.service ? [input.service] : null,
      maxUses: 1,
      expiresAt: yearLater(now),
      recipientName: input.recipientName || null,
      note: `bought online by ${input.buyerEmail.toLowerCase()}`,
      active: false,
    },
    "GIFT",
  );
  const url = voucherUrl(row.code, input.locale, config);
  const value = input.service ? serviceName(input.service, input.locale) : formatEur(priceCents, input.locale);
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    metadata: { gift_code_id: row.id, locale: input.locale },
    customer_email: input.buyerEmail,
    locale: input.locale,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: priceCents,
          tax_behavior: payments.pricesIncludeVat ? "inclusive" : "exclusive",
          product_data: { name: `${voucherName[input.locale]}: ${value}` },
        },
      },
    ],
    invoice_creation: { enabled: true },
    success_url: `${url}?paid=1`,
    cancel_url: `${config.siteUrl}/${input.locale}/gift`,
  });
  await db().update(offerCodes).set({ stripeCheckoutSessionId: session.id }).where(eq(offerCodes.id, row.id));
  return session.url!;
}

const formatEur = (cents: number, locale: Locale) =>
  new Intl.NumberFormat(intl[locale], { style: "currency", currency: "EUR", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

// A paid voucher session switches its code on and emails the buyer the voucher, once.
export async function activateGift(session: Stripe.Checkout.Session, config: BookingConfig) {
  const id = session.metadata?.gift_code_id;
  if (!id || session.payment_status !== "paid") return false;
  const [row] = await db()
    .update(offerCodes)
    .set({ active: true })
    .where(and(eq(offerCodes.id, id), eq(offerCodes.active, false), eq(offerCodes.stripeCheckoutSessionId, session.id)))
    .returning();
  if (row && session.customer_email) {
    const locale: Locale = session.metadata?.locale === "sl" ? "sl" : "en";
    const { amountCents, service } = giftValue(row);
    const value = service ? serviceName(service, locale) : formatEur(amountCents ?? 0, locale);
    await sendEmail({
      to: session.customer_email,
      locale,
      template: "giftVoucher",
      props: { code: row.code, value, voucherUrl: voucherUrl(row.code, locale, config) },
    });
  }
  return true;
}

// The voucher page after Stripe: asks Stripe whether a not yet active voucher has been paid.
export async function confirmGift(row: CodeRow, config: BookingConfig) {
  if (row.active || !row.stripeCheckoutSessionId) return row;
  try {
    const session = await stripe().checkout.sessions.retrieve(row.stripeCheckoutSessionId);
    await activateGift(session, config);
  } catch {
    console.warn(`gift voucher ${row.id}: could not ask Stripe about its payment`);
  }
  const [fresh] = await db().select().from(offerCodes).where(eq(offerCodes.id, row.id));
  return fresh!;
}
