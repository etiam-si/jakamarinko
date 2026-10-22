import { eq } from "drizzle-orm";
import { db } from "@jakamarinko/db";
import { refunds } from "@jakamarinko/db/schema";
import type { BookingRow } from "../booking/bookings";
import type { BookingConfig } from "../booking/config";
import { paymentsConfig } from "./config";
import { stripe } from "./stripe";

export type CancelledBy = "customer" | "coach";

// The terms (T17): a customer cancelling at least 24 h before gets everything back, later nothing.
// When we cancel, the payment is always refunded in full.
export function refundDue(row: BookingRow, by: CancelledBy, now: Date, config: BookingConfig) {
  if (row.booking.paidVia !== "stripe" || !row.booking.stripePaymentIntentId) return false;
  if (by === "coach") return true;
  return row.booking.startAt.getTime() - now.getTime() >= config.cancelMin * 60_000;
}

// A full refund of the booking's payment, once: Stripe's idempotency key and the unique row both stop a second one.
export async function refund(row: BookingRow, reason: (typeof refunds.$inferInsert)["reason"]) {
  const b = row.booking;
  const [done] = await db().select().from(refunds).where(eq(refunds.bookingId, b.id));
  if (done) return done;
  const created = await stripe().refunds.create(
    { payment_intent: b.stripePaymentIntentId!, metadata: { booking_id: b.id, reason } },
    { idempotencyKey: `refund-${b.id}` },
  );
  const [saved] = await db()
    .insert(refunds)
    .values({ bookingId: b.id, stripeRefundId: created.id, amountCents: created.amount, reason })
    .onConflictDoNothing()
    .returning();
  return saved;
}

// Called by the cancel routes with the booking as it was before the cancel. A paid booking is refunded when the
// terms say so; an unpaid one has its Checkout page closed, so it can't be paid any more. A Stripe failure is logged
// (booking id only) and doesn't undo the cancel: the coach refunds by hand from the Stripe dashboard.
export async function settleCancelled(row: BookingRow, by: CancelledBy, now: Date, config: BookingConfig) {
  // With the keys gone nothing can be refunded here; with only PAYMENTS_ENABLED off, earlier payments still are.
  if (!paymentsConfig().secretKey) return;
  const b = row.booking;
  try {
    if (b.status === "pending_payment" && b.stripeCheckoutSessionId) {
      await stripe().checkout.sessions.expire(b.stripeCheckoutSessionId).catch(() => undefined);
    } else if (refundDue(row, by, now, config)) {
      await refund(row, by === "coach" ? "coach_cancelled" : "customer_cancelled");
    }
  } catch (err) {
    console.error(`refund for booking ${b.id} failed, refund it in the Stripe dashboard: ${err instanceof Error ? err.message : String(err)}`);
  }
}
