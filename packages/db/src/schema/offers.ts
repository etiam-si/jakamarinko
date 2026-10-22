import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./booking";
import { users } from "./users";

// promo: made by the owner or head coach. free_test: "give a free test". referral: a customer's personal link.
// credit: the referrer's reward. season_retest: the two retests of a season pack. gift: a gift voucher.
export const offerCodeKinds = ["promo", "free_test", "referral", "credit", "season_retest", "gift"] as const;
export const offerCodeKind = pgEnum("offer_code_kind", offerCodeKinds);
export const discountTypes = ["free", "percent", "fixed"] as const;
export const discountType = pgEnum("discount_type", discountTypes);

// A code entered at the booking review (case-insensitive: stored upper case). No health data, ever.
export const offerCodes = pgTable(
  "offer_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    kind: offerCodeKind("kind").notNull(),
    discountType: discountType("discount_type").notNull(),
    // percent: 1–100; fixed: euro cents off. Unused for free.
    value: integer("value").default(0).notNull(),
    // Catalog ids it applies to; null for every service.
    services: text("services").array(),
    // Uses by bookings that aren't cancelled; null for no limit.
    maxUses: integer("max_uses"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    // Only a booking with this email may use it.
    email: text("email"),
    note: text("note"),
    // Who it was made for (free test, gift voucher), shown on the voucher.
    recipientName: text("recipient_name"),
    // The customer whose referral link it is, or who earned the credit.
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "cascade" }),
    // credit: the referred booking that earned it, so completing it twice makes one credit.
    // season_retest: the season pack booking it came with.
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    createdByUserId: text("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    // A gift voucher bought online stays inactive until Stripe says it's paid.
    active: boolean("active").default(true).notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("offer_codes_one_referral").on(t.ownerUserId).where(sql`${t.kind} = 'referral'`),
    uniqueIndex("offer_codes_one_credit").on(t.bookingId).where(sql`${t.kind} = 'credit'`),
    check("offer_codes_value", sql`${t.value} >= 0 and (${t.discountType} <> 'percent' or ${t.value} between 1 and 100)`),
  ],
);

// One saving per booking at most: a code or the founding discount, whichever saves more.
export const offerRedemptions = pgTable(
  "offer_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    // Null for the founding discount.
    codeId: uuid("code_id").references(() => offerCodes.id, { onDelete: "restrict" }),
    listCents: integer("list_cents").notNull(),
    savedCents: integer("saved_cents").notNull(),
    paidCents: integer("paid_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("offer_redemptions_code_id").on(t.codeId), check("offer_redemptions_sum", sql`${t.paidCents} = ${t.listCents} - ${t.savedCents}`)],
);

// The first founding athletes, by email, numbered in the order their first booking was completed.
export const foundingAthletes = pgTable("founding_athletes", {
  email: text("email").primaryKey(),
  number: smallint("number").notNull().unique(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// One row (id 1). The owner can switch the founding offer off.
export const offerSettings = pgTable("offer_settings", {
  id: smallint("id").primaryKey().default(1),
  foundingEnabled: boolean("founding_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
