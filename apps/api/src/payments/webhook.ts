import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@jakamarinko/db";
import { bookings, stripeEvents } from "@jakamarinko/db/schema";
import { findBooking } from "../booking/bookings";
import type { Q } from "../booking/calendar";
import type { BookingConfig } from "../booking/config";
import { sendCancelled, sendConfirmed } from "../booking/emails";
import { reportBookingPaid } from "../conversions/record";
import { refund } from "./refunds";
import { trackServer } from "./track";

type Session = Stripe.Checkout.Session;
type Outcome = { kind: "confirmed" | "late" | "expired"; bookingId: string; amountCents?: number | null } | null;

const bookingIdOf = (s: Session) => s.client_reference_id ?? s.metadata?.booking_id ?? null;
const intentOf = (s: Session) => (typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null));

// A paid session confirms its booking, if the booking is still waiting. A booking that expired in the meantime
// keeps the payment on record, and the payment is refunded after the transaction.
async function applyPaid(q: Q, session: Session): Promise<Outcome> {
  const id = bookingIdOf(session);
  if (!id || session.payment_status !== "paid") return null;
  const paid = { paidVia: "stripe" as const, stripePaymentIntentId: intentOf(session), stripeCheckoutSessionId: session.id };
  const [confirmed] = await q
    .update(bookings)
    .set({ ...paid, status: "confirmed" })
    .where(and(eq(bookings.id, id), eq(bookings.status, "pending_payment")))
    .returning({ id: bookings.id });
  if (confirmed) return { kind: "confirmed", bookingId: id, amountCents: session.amount_total };
  const [late] = await q
    .update(bookings)
    .set(paid)
    .where(and(eq(bookings.id, id), eq(bookings.status, "cancelled"), eq(bookings.paidVia, "none")))
    .returning({ id: bookings.id });
  return late ? { kind: "late", bookingId: id } : null;
}

// Stripe closed the page unpaid: the slot is free again.
async function applyExpired(q: Q, session: Session, now: Date): Promise<Outcome> {
  const id = bookingIdOf(session);
  if (!id) return null;
  const [row] = await q
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: now, cancelReason: "Not paid in time" })
    .where(and(eq(bookings.id, id), eq(bookings.status, "pending_payment"), eq(bookings.stripeCheckoutSessionId, session.id)))
    .returning({ id: bookings.id });
  return row ? { kind: "expired", bookingId: id } : null;
}

// Emails, the conversion and refunds, once the change is committed.
async function followUp(outcome: Outcome, config: BookingConfig) {
  if (!outcome) return;
  const row = await findBooking(outcome.bookingId);
  if (outcome.kind === "confirmed") {
    await sendConfirmed(row, config);
    const value = (outcome.amountCents ?? 0) / 100;
    await trackServer("booking_paid", { service: row.service, value, currency: "EUR" }, config, row.booking.locale);
    await reportBookingPaid(row.booking.id);
  } else if (outcome.kind === "late") {
    console.warn(`booking ${row.booking.id} was paid after its hold expired; refunding`);
    await refund(row, "late_payment");
    await sendCancelled(row, config);
  }
}

// Confirms a paid session outside the webhook (the expiry job finds it complete). Safe to run any number of times.
export async function confirmPaidSession(session: Session, config: BookingConfig) {
  await followUp(await applyPaid(db(), session), config);
}

// One verified Stripe event. Its id is stored in the same transaction as the change it makes, so a replay is a no-op.
export async function handleEvent(event: Stripe.Event, now: Date, config: BookingConfig) {
  const outcome = await db().transaction(async (tx) => {
    const [fresh] = await tx.insert(stripeEvents).values({ id: event.id, type: event.type }).onConflictDoNothing().returning();
    if (!fresh) return null;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        return applyPaid(tx, event.data.object);
      case "checkout.session.expired":
        return applyExpired(tx, event.data.object, now);
      default:
        return null;
    }
  });
  await followUp(outcome, config);
}
