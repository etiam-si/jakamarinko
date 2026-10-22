import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./booking";

// Stripe events already handled. The webhook inserts the event id in the same transaction as its change,
// so a replayed or retried event does nothing the second time.
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

// customer_cancelled: 24 h or more before. coach_cancelled: always. late_payment: paid after the hold had expired.
export const refundReasons = ["customer_cancelled", "coach_cancelled", "late_payment"] as const;
export const refundReason = pgEnum("refund_reason", refundReasons);

// One full refund per booking at most: the unique booking id keeps a second one from being made.
export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .unique()
    .references(() => bookings.id),
  stripeRefundId: text("stripe_refund_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  reason: refundReason("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
