import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { locales } from "@jakamarinko/types";
import { coaches, locations, users } from "./users";

export const serviceKind = pgEnum("service_kind", ["lab_test", "session"]);
export const bookingStatuses = ["pending_payment", "confirmed", "cancelled", "completed", "no_show"] as const;
export const bookingStatus = pgEnum("booking_status", bookingStatuses);
export const paidVia = pgEnum("paid_via", ["stripe", "credit", "none"]);
// closed: no bookings that day (or between start and end). open: extra hours on top of the weekly template.
export const availabilityExceptionKind = pgEnum("availability_exception_kind", ["closed", "open"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

// One row per bookable item of the catalog (packages/types), kept in sync by the booking seed on api start.
// Names and texts stay in the catalog; this is what a booking points at.
export const serviceTypes = pgTable("service_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  catalogId: text("catalog_id").notNull().unique(),
  kind: serviceKind("kind").notNull(),
  durationMin: integer("duration_min").notNull(),
  priceCents: integer("price_cents").notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
});

// A coach's weekly template, in Ljubljana wall-clock time. weekday: 1 = Monday … 7 = Sunday.
export const availability = pgTable(
  "availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coaches.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(),
    start: time("start").notNull(),
    end: time("end").notNull(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id),
    ...timestamps,
  },
  (t) => [
    index("availability_coach_id").on(t.coachId),
    check("availability_weekday", sql`${t.weekday} between 1 and 7`),
    check("availability_order", sql`${t.end} > ${t.start}`),
  ],
);

// Holidays and extra days. Without start/end a closed exception closes whole days; open ones always have hours.
export const availabilityExceptions = pgTable(
  "availability_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coaches.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    kind: availabilityExceptionKind("kind").notNull(),
    start: time("start"),
    end: time("end"),
    // Open hours elsewhere than the default location.
    locationId: uuid("location_id").references(() => locations.id),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    index("availability_exceptions_coach_id").on(t.coachId, t.endDate),
    check("availability_exceptions_dates", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceTypeId: uuid("service_type_id")
      .notNull()
      .references(() => serviceTypes.id),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coaches.id),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id),
    // Null for a guest. Name, email and phone are kept either way: they are who the booking is for.
    customerUserId: text("customer_user_id").references(() => users.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: bookingStatus("status").notNull(),
    paidVia: paidVia("paid_via").default("none").notNull(),
    // Filled by payments (T13).
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    utm: jsonb("utm").$type<Record<string, string>>(),
    locale: text("locale", { enum: locales }).notNull(),
    // Health data (GDPR special category): never logged, shown only to the customer and the booking's coach.
    healthAnswers: jsonb("health_answers").$type<Record<string, boolean | string>>(),
    healthConsentAt: timestamp("health_consent_at", { withTimezone: true }),
    // Lets a guest open and cancel the booking from the link in their emails.
    manageToken: text("manage_token").notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    // Set when the reminder job claims the booking, so it is never sent twice.
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("bookings_coach_start").on(t.coachId, t.startAt),
    index("bookings_customer_user_id").on(t.customerUserId),
    index("bookings_status_start").on(t.status, t.startAt),
    check("bookings_order", sql`${t.endAt} > ${t.startAt}`),
  ],
);
