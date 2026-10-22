import { and, eq, gte, inArray, ne } from "drizzle-orm";
import { offerRules, type OfferErrorCode, type Quote } from "@jakamarinko/api";
import { bookings, foundingAthletes, offerCodes, offerRedemptions, serviceTypes, users } from "@jakamarinko/db/schema";
import type { Q } from "../booking/calendar";
import { bookable } from "../booking/catalog";
import { ApiError } from "../lib/errors";
import { normalizeCode, saving, usesOf, type CodeRow } from "./codes";

export type Price = {
  listCents: number;
  paidCents: number;
  savedCents: number;
  source: "code" | "founding" | null;
  code: CodeRow | null;
};

type Ask = { service: string; listCents: number; email?: string; code?: string; now: Date };

const messages: Record<OfferErrorCode, string> = {
  code_unknown: "This code doesn't exist",
  code_expired: "This code has expired",
  code_used_up: "This code has been used up",
  code_not_for_service: "This code isn't valid for this service",
  code_not_for_you: "This code isn't valid for this email",
  retest_not_eligible: "The lactate retest needs a test with a lactate profile in the last 120 days",
};

export const offerError = (code: OfferErrorCode) => new ApiError(422, code, messages[code]);

// Every service that measures lactate: the retest follows any of them.
export const lactateServices = () =>
  bookable
    .filter((s) => ["lactate-profile", "lactate-retest"].includes(s.id) || (s.kind === "lab_test" && s.contains?.includes("lactate-profile")))
    .map((s) => s.id as string);

// The lactate retest: a completed booking with a lactate test on the same email in the last 120 days.
export async function retestEligible(q: Q, email: string | undefined, now: Date) {
  if (!email) return false;
  const since = new Date(now.getTime() - offerRules.retestDays * 86_400_000);
  const [found] = await q
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(serviceTypes, eq(serviceTypes.id, bookings.serviceTypeId))
    .where(
      and(
        eq(bookings.customerEmail, email.toLowerCase()),
        eq(bookings.status, "completed"),
        gte(bookings.startAt, since),
        inArray(serviceTypes.catalogId, lactateServices()),
      ),
    )
    .limit(1);
  return !!found;
}

// For life: switching the offer off stops new places, not the discount of those who have one.
async function isFounding(q: Q, email: string | undefined) {
  if (!email) return false;
  const [row] = await q.select({ email: foundingAthletes.email }).from(foundingAthletes).where(eq(foundingAthletes.email, email.toLowerCase()));
  return !!row;
}

// Why this code can't be used for this booking, or null. `lock` holds the code's row until the transaction ends, so
// parallel bookings count its uses one after the other.
async function checkCode(q: Q, raw: string, a: Ask, lock: boolean): Promise<{ row: CodeRow | null; error: OfferErrorCode | null }> {
  const select = q.select().from(offerCodes).where(eq(offerCodes.code, normalizeCode(raw)));
  const [row] = lock ? await select.for("update") : await select;
  if (!row || !row.active) return { row: null, error: "code_unknown" };
  const email = a.email?.toLowerCase();
  if (row.expiresAt && row.expiresAt <= a.now) return { row, error: "code_expired" };
  if (row.services && !row.services.includes(a.service)) return { row, error: "code_not_for_service" };
  if (row.email && row.email !== email) return { row, error: "code_not_for_you" };
  if (row.kind === "referral") {
    // Only a friend's first booking, never the referrer's own.
    if (!email) return { row, error: "code_not_for_you" };
    const [owner] = row.ownerUserId ? await q.select({ email: users.email }).from(users).where(eq(users.id, row.ownerUserId)) : [];
    if (!owner || owner.email.toLowerCase() === email) return { row, error: "code_not_for_you" };
    const [earlier] = await q
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.customerEmail, email), ne(bookings.status, "cancelled")))
      .limit(1);
    if (earlier) return { row, error: "code_not_for_you" };
  }
  if (row.maxUses !== null && (await usesOf(q, row.id)) >= row.maxUses) return { row, error: "code_used_up" };
  return { row, error: null };
}

// The price of a booking: the list price less the code or the founding discount, whichever saves more (they don't stack).
async function evaluate(q: Q, a: Ask, lock: boolean) {
  const checked = a.code ? await checkCode(q, a.code, a, lock) : { row: null, error: null };
  const codeSaved = checked.row && !checked.error ? saving(checked.row, a.listCents) : 0;
  const foundingSaved = (await isFounding(q, a.email)) ? Math.round((a.listCents * offerRules.foundingPercent) / 100) : 0;
  const useCode = codeSaved > 0 && codeSaved > foundingSaved;
  const savedCents = useCode ? codeSaved : foundingSaved;
  const price: Price = {
    listCents: a.listCents,
    savedCents,
    paidCents: a.listCents - savedCents,
    source: useCode ? "code" : foundingSaved > 0 ? "founding" : null,
    code: useCode ? checked.row : null,
  };
  // A season pack's retest code stands in for the earlier test.
  const retestOk =
    a.service !== "lactate-retest" || (!checked.error && checked.row?.kind === "season_retest") || (await retestEligible(q, a.email, a.now));
  return { price, codeRow: checked.row, codeError: checked.error, retestOk };
}

// For the review step: never fails on a bad code, it says why.
export async function quote(q: Q, a: Ask): Promise<Quote> {
  const { price, codeRow, codeError, retestOk } = await evaluate(q, a, false);
  return {
    listCents: price.listCents,
    priceCents: price.paidCents,
    savedCents: price.savedCents,
    source: price.source,
    code: codeError ? null : (codeRow?.code ?? null),
    codeError,
    retestEligible: retestOk,
  };
}

// Inside the booking transaction: 422 with the reason when the code or the retest doesn't apply.
export async function priceBooking(q: Q, a: Ask): Promise<Price> {
  const { price, codeError, retestOk } = await evaluate(q, a, true);
  if (codeError) throw offerError(codeError);
  if (!retestOk) throw offerError("retest_not_eligible");
  return price;
}

// Records the saving with the booking, in the same transaction. Nothing saved, nothing recorded.
export async function claimSaving(q: Q, bookingId: string, price: Price) {
  if (!price.source) return;
  await q.insert(offerRedemptions).values({
    bookingId,
    codeId: price.code?.id ?? null,
    listCents: price.listCents,
    savedCents: price.savedCents,
    paidCents: price.paidCents,
  });
}
