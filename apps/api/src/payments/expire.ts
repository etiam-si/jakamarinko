import { and, eq, lte } from "drizzle-orm";
import { db } from "@jakamarinko/db";
import { bookings } from "@jakamarinko/db/schema";
import { bookingConfig } from "../booking/config";
import type { Job } from "../lib/run-jobs";
import { paymentsConfig } from "./config";
import { stripe } from "./stripe";
import { confirmPaidSession } from "./webhook";

// Ends the hold of every booking still unpaid after PAYMENT_HOLD_MIN, which frees its slot. Its Checkout page is closed
// first; when Stripe says it was paid after all, the booking is confirmed instead. A booking whose page Stripe can't be
// asked about right now waits for the next run. Safe to run twice: the cancel only touches bookings still waiting.
export async function expireUnpaid(now = new Date()) {
  const config = paymentsConfig();
  const cutoff = new Date(now.getTime() - config.holdMin * 60_000);
  const due = await db()
    .select({ id: bookings.id, sessionId: bookings.stripeCheckoutSessionId })
    .from(bookings)
    .where(and(eq(bookings.status, "pending_payment"), lte(bookings.createdAt, cutoff)));

  let expired = 0;
  for (const b of due) {
    if (b.sessionId && config.secretKey) {
      const session = await stripe()
        .checkout.sessions.expire(b.sessionId)
        .catch(() => stripe().checkout.sessions.retrieve(b.sessionId!))
        .catch(() => null);
      if (!session || session.status === "open") continue;
      if (session.status === "complete") {
        await confirmPaidSession(session, bookingConfig());
        continue;
      }
    }
    const [row] = await db()
      .update(bookings)
      .set({ status: "cancelled", cancelledAt: now, cancelReason: "Not paid in time" })
      .where(and(eq(bookings.id, b.id), eq(bookings.status, "pending_payment")))
      .returning({ id: bookings.id });
    if (row) expired++;
  }
  return expired;
}

export const paymentExpiry: Job = { name: "payment-expiry", everyMs: 60_000, run: async () => void (await expireUnpaid()) };
