import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./booking";
import { requests } from "./requests";

// pending: waiting for its moment (a booking is reported once paid). sent: Meta accepted it. skipped: no marketing
// consent. off: no Meta keys at that time. failed: Meta refused it or didn't answer.
export const conversionStatuses = ["pending", "sent", "skipped", "off", "failed"] as const;
export const conversionStatus = pgEnum("conversion_status", conversionStatuses);

// The device a conversion came from, as Meta matches it. Kept only with marketing consent, and only until it is sent.
export type ConversionClient = { userAgent?: string; ip?: string; fbp?: string; fbc?: string; sourceUrl?: string };

// One server-side conversion event (T14) per booking or contact request. The marketing consent is the visitor's
// cookie choice when they booked or wrote; without it nothing about them leaves this server.
export const conversions = pgTable(
  "conversions",
  {
    // Shared with the browser's pixel event, so Meta counts the two as one.
    eventId: text("event_id").primaryKey(),
    name: text("name").notNull(),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").references(() => requests.id, { onDelete: "cascade" }),
    marketingConsent: boolean("marketing_consent").notNull(),
    client: jsonb("client").$type<ConversionClient>(),
    status: conversionStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    reportedAt: timestamp("reported_at", { withTimezone: true }),
  },
  (t) => [index("conversions_booking_id").on(t.bookingId), index("conversions_request_id").on(t.requestId)],
);
