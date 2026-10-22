import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./booking";
import { coaches } from "./users";

// connected: syncing. needs_reconnect: Google refused the tokens (access revoked); booking works without sync.
export const calendarStatuses = ["connected", "needs_reconnect"] as const;
export const calendarStatus = pgEnum("calendar_status", calendarStatuses);

// A coach's Google Calendar connection (T16). Tokens are encrypted with CALENDAR_TOKEN_KEY and never logged.
// Disconnecting deletes the row.
export const calendarConnections = pgTable("calendar_connections", {
  coachId: uuid("coach_id")
    .primaryKey()
    .references(() => coaches.id, { onDelete: "cascade" }),
  // The Google account's primary calendar id, which is its email address.
  account: text("account").notNull(),
  refreshToken: text("refresh_token").notNull(),
  accessToken: text("access_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  // Where new bookings go. Busy times are read from this one and the primary calendar.
  calendarId: text("calendar_id").default("primary").notNull(),
  calendarName: text("calendar_name"),
  status: calendarStatus("status").default("connected").notNull(),
  // Busy times from Google (ISO instants), as of busyFetchedAt; they block slots like bookings do.
  busy: jsonb("busy").$type<{ start: string; end: string }[]>().default([]).notNull(),
  busyFetchedAt: timestamp("busy_fetched_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// A booking's event in Google, with the times it was last written with. The event id is derived from the booking id.
export const calendarEvents = pgTable("calendar_events", {
  bookingId: uuid("booking_id")
    .primaryKey()
    .references(() => bookings.id, { onDelete: "cascade" }),
  coachId: uuid("coach_id")
    .notNull()
    .references(() => coaches.id, { onDelete: "cascade" }),
  calendarId: text("calendar_id").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
