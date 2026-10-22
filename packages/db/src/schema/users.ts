import { sql } from "drizzle-orm";
import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { defaultLocale, locales, roles } from "@jakamarinko/types";

export const role = pgEnum("role", roles);
export const consentKinds = ["health_data", "marketing"] as const;
export const consentKind = pgEnum("consent_kind", consentKinds);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

// Better Auth's user table plus our locale and role. Ids are Better Auth's random strings.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  locale: text("locale", { enum: locales }).default(defaultLocale).notNull(),
  role: role("role").default("customer").notNull(),
  ...timestamps,
});

export const coaches = pgTable("coaches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
});

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("locations_one_default").on(t.isDefault).where(sql`${t.isDefault}`)],
);

// One row per grant. Withdrawing sets withdrawn_at and keeps the row, so the history stays provable.
export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: consentKind("kind").notNull(),
    version: text("version").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (t) => [
    index("consents_user_id").on(t.userId),
    // At most one active grant per kind.
    uniqueIndex("consents_one_active").on(t.userId, t.kind).where(sql`${t.withdrawnAt} is null`),
  ],
);
