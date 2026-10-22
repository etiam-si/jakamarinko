import { and, eq } from "drizzle-orm";
import { offerRules } from "@jakamarinko/api";
import { db } from "@jakamarinko/db";
import { bookings, offerCodes, offerRedemptions, users } from "@jakamarinko/db/schema";
import { sendEmail } from "@jakamarinko/email";
import type { BookingRow } from "../booking/bookings";
import type { BookingConfig } from "../booking/config";
import { insertCode } from "./codes";
import { grantFounding } from "./founding";

const monthsLater = (date: Date, months: number) => {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
};

// The coach marked a booking completed: its customer may become a founding athlete, and when it came through a
// referral link the referrer gets their credit (once per booking: completing it again makes nothing new).
export async function bookingCompleted(bookingId: string, config: BookingConfig) {
  const credit = await db().transaction(async (tx) => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!b || b.status !== "completed") return null;
    await grantFounding(tx, b.customerEmail, b.id);

    const [referral] = await tx
      .select({ ownerUserId: offerCodes.ownerUserId })
      .from(offerRedemptions)
      .innerJoin(offerCodes, eq(offerCodes.id, offerRedemptions.codeId))
      .where(and(eq(offerRedemptions.bookingId, b.id), eq(offerCodes.kind, "referral")));
    if (!referral?.ownerUserId) return null;
    const [done] = await tx
      .select({ id: offerCodes.id })
      .from(offerCodes)
      .where(and(eq(offerCodes.kind, "credit"), eq(offerCodes.bookingId, b.id)));
    if (done) return null;
    const [referrer] = await tx.select().from(users).where(eq(users.id, referral.ownerUserId));
    if (!referrer) return null;
    const code = await insertCode(
      tx,
      {
        kind: "credit",
        discountType: "fixed",
        value: offerRules.referralCents,
        maxUses: 1,
        email: referrer.email.toLowerCase(),
        ownerUserId: referrer.id,
        bookingId: b.id,
        expiresAt: monthsLater(new Date(), 12),
      },
      "CR",
    );
    return { code, referrer };
  });
  if (!credit) return;
  const { code, referrer } = credit;
  await sendEmail({
    to: referrer.email,
    locale: referrer.locale,
    template: "referralCredit",
    props: {
      name: referrer.name,
      code: code.code,
      amountCents: code.value,
      bookUrl: `${config.siteUrl}/${referrer.locale}/booking?code=${encodeURIComponent(code.code)}`,
    },
  });
}

// A season pack comes with two single-use lactate retest codes for the buyer's email, valid for 6 months.
// Made once per booking; a second confirmation email shows the same two.
export async function seasonRetest(row: BookingRow, config: BookingConfig) {
  if (row.service !== "season") return undefined;
  const b = row.booking;
  const existing = await db()
    .select()
    .from(offerCodes)
    .where(and(eq(offerCodes.kind, "season_retest"), eq(offerCodes.bookingId, b.id)))
    .orderBy(offerCodes.code);
  const expiresAt = monthsLater(b.createdAt, offerRules.seasonRetestMonths);
  const codes = [...existing];
  while (codes.length < 2) {
    codes.push(
      await insertCode(
        db(),
        {
          kind: "season_retest",
          discountType: "free",
          services: ["lactate-retest"],
          maxUses: 1,
          email: b.customerEmail,
          bookingId: b.id,
          expiresAt,
        },
        "RT",
      ),
    );
  }
  return {
    codes: codes.map((c) => c.code),
    expiresAt: codes[0]!.expiresAt ?? expiresAt,
    bookUrl: `${config.siteUrl}/${b.locale}/booking?service=lactate-retest&code=${encodeURIComponent(codes[0]!.code)}`,
  };
}
