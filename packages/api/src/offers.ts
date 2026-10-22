import { z } from "zod";
import { labTestIds, locales, sessionIds } from "@jakamarinko/types";

const ServiceId = z.enum([...labTestIds, ...sessionIds]);
const LocalDate = z.iso.date();
const Instant = z.iso.datetime({ offset: true });

// Codes are case-insensitive: whatever is typed is trimmed and upper-cased.
export const OfferCodeString = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{4,32}$/, "4–32 letters, digits or dashes");

export const OfferCodeKind = z.enum(["promo", "free_test", "referral", "credit", "season_retest", "gift"]);
export type OfferCodeKind = z.infer<typeof OfferCodeKind>;
export const DiscountType = z.enum(["free", "percent", "fixed"]);
export type DiscountType = z.infer<typeof DiscountType>;

// Why a code can't be used. retest_not_eligible: the lactate retest needs a test with us in the last 120 days.
export const OfferErrorCode = z.enum([
  "code_unknown",
  "code_expired",
  "code_used_up",
  "code_not_for_service",
  "code_not_for_you",
  "retest_not_eligible",
]);
export type OfferErrorCode = z.infer<typeof OfferErrorCode>;

// POST /api/offers/codes (owner, head_coach). Without `code` one is made up. percent: 1–100; fixed: euro cents.
export const CreateCodeInput = z
  .object({
    code: OfferCodeString.optional(),
    discountType: DiscountType,
    value: z.number().int().min(0).max(1_000_000).default(0),
    services: z.array(ServiceId).min(1).max(30).nullish(),
    maxUses: z.number().int().min(1).max(100_000).nullish(),
    expiresAt: Instant.nullish(),
    email: z.email().max(320).nullish(),
    note: z.string().trim().max(500).nullish(),
  })
  .refine((c) => c.discountType !== "percent" || (c.value >= 1 && c.value <= 100), { path: ["value"], message: "1 to 100" })
  .refine((c) => c.discountType !== "fixed" || c.value >= 1, { path: ["value"], message: "more than 0" });
export type CreateCodeInput = z.infer<typeof CreateCodeInput>;

// PATCH /api/offers/codes/:id: switch a code off (or on again).
export const UpdateCodeInput = z.object({ active: z.boolean() });

export const OfferCode = z.object({
  id: z.string(),
  code: z.string(),
  kind: OfferCodeKind,
  discountType: DiscountType,
  value: z.number(),
  services: z.array(z.string()).nullable(),
  maxUses: z.number().nullable(),
  uses: z.number(),
  expiresAt: Instant.nullable(),
  email: z.string().nullable(),
  note: z.string().nullable(),
  recipientName: z.string().nullable(),
  active: z.boolean(),
  createdAt: Instant,
});
export type OfferCode = z.infer<typeof OfferCode>;

// POST /api/offers/free-test: a single-use free code for that email, sent to them with a book link.
export const FreeTestInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().max(320),
  service: ServiceId,
  locale: z.enum(locales),
  note: z.string().trim().max(500).optional(),
});
export type FreeTestInput = z.infer<typeof FreeTestInput>;

// POST /api/offers/gifts (owner, head_coach): a voucher worth an amount, or one service.
export const GiftInput = z
  .object({
    amountCents: z.number().int().min(100).max(1_000_000).optional(),
    service: ServiceId.optional(),
    recipientName: z.string().trim().max(200).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((g) => !g.amountCents !== !g.service, { path: ["amountCents"], message: "an amount or a service" });
export type GiftInput = z.infer<typeof GiftInput>;

// POST /api/offers/gifts/checkout (anyone, only with online payment on): buy a voucher.
export const GiftCheckoutInput = z
  .object({
    amountCents: z.number().int().min(1000).max(100_000).optional(),
    service: ServiceId.optional(),
    buyerEmail: z.email().max(320),
    recipientName: z.string().trim().max(200).optional(),
    locale: z.enum(locales),
  })
  .refine((g) => !g.amountCents !== !g.service, { path: ["amountCents"], message: "an amount or a service" });
export type GiftCheckoutInput = z.infer<typeof GiftCheckoutInput>;
export const GiftCheckout = z.object({ url: z.url() });
export type GiftCheckout = z.infer<typeof GiftCheckout>;

// GET /api/offers/gift/:code: what the voucher page shows.
export const GiftVoucher = z.object({
  code: z.string(),
  amountCents: z.number().nullable(),
  // What it is worth in euro cents: the amount, or the price of the service today.
  valueCents: z.number(),
  service: z.string().nullable(),
  serviceName: z.string().nullable(),
  recipientName: z.string().nullable(),
  expiresAt: Instant.nullable(),
  used: z.boolean(),
});
export type GiftVoucher = z.infer<typeof GiftVoucher>;

// POST /api/offers/quote: the price at the review step, with the code (if any) and the founding discount.
export const QuoteInput = z.object({
  service: ServiceId,
  email: z.email().max(320).optional(),
  code: z.string().trim().max(40).optional(),
});
export type QuoteInput = z.infer<typeof QuoteInput>;
export const Quote = z.object({
  listCents: z.number(),
  priceCents: z.number(),
  savedCents: z.number(),
  // What gives the saving: the code, the founding discount, or nothing.
  source: z.enum(["code", "founding"]).nullable(),
  // The code as stored, when one was entered and is valid.
  code: z.string().nullable(),
  // Why the entered code doesn't apply (the price is then without it).
  codeError: OfferErrorCode.nullable(),
  // Only for the lactate retest: false when it can't be booked with this email.
  retestEligible: z.boolean(),
});
export type Quote = z.infer<typeof Quote>;

// GET /api/offers/founding (public): places left of 20, from the database. left is 0 when the offer is off.
export const Founding = z.object({ enabled: z.boolean(), places: z.number(), taken: z.number(), left: z.number() });
export type Founding = z.infer<typeof Founding>;
export const FoundingInput = z.object({ enabled: z.boolean() });

// GET /api/offers/referral (signed in): their link and the credits it earned.
export const Referral = z.object({
  code: z.string(),
  url: z.url(),
  credits: z.array(z.object({ code: z.string(), amountCents: z.number(), used: z.boolean(), expiresAt: Instant.nullable() })),
});
export type Referral = z.infer<typeof Referral>;

// GET /api/offers/report?from&to (owner, head_coach): codes with their uses, and totals of bookings made in the range.
export const OffersReportQuery = z
  .object({ from: LocalDate, to: LocalDate })
  .refine((q) => q.to >= q.from && Date.parse(q.to) - Date.parse(q.from) <= 366 * 86_400_000, {
    path: ["to"],
    message: "from..to must be 0 to 366 days",
  });
export type OffersReportQuery = z.infer<typeof OffersReportQuery>;
// Uses, what those bookings paid and what they saved, for bookings made in the range (cancelled ones don't count).
const Period = z.object({ redemptions: z.number(), revenueCents: z.number(), discountCents: z.number() });
export const OffersReport = z.object({
  codes: z.array(OfferCode.extend({ period: Period })),
  // The founding discount has no code.
  foundingPeriod: Period,
  totals: Period,
  founding: Founding,
});
export type OffersReport = z.infer<typeof OffersReport>;

// Founding athletes: 20 places, 30 % off for life. Referral: 10 € off for the friend, 10 € credit for the referrer.
export const offerRules = { foundingPlaces: 20, foundingPercent: 30, referralCents: 1000, retestDays: 120, seasonRetestMonths: 6 } as const;
