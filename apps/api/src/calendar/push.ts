import { and, eq, gt, isNull, ne, or } from "drizzle-orm";
import type { Locale } from "@jakamarinko/types";
import { db } from "@jakamarinko/db";
import { bookings, calendarConnections, calendarEvents, coaches, users } from "@jakamarinko/db/schema";
import { findBookings, type BookingRow } from "../booking/bookings";
import { serviceName } from "../booking/catalog";
import { loggable } from "../lib/errors";
import { calendarConfig } from "./config";
import { connectionOf, withGoogle } from "./connection";
import { deleteEvent, GoogleError, insertEvent, patchEvent, type EventBody } from "./google";

// Google event ids use the characters a–v and 0–9, so a booking's uuid without dashes fits. A fixed id makes every
// push idempotent: a second insert gets 409 and becomes an update.
export const eventId = (bookingId: string) => `jm${bookingId.replaceAll("-", "")}`;

// What goes to Google: the customer's first name and the service, the time and the place. Never their email,
// phone or health answers: the coach's calendar may be shared or synced to other devices.
export function eventFor(row: BookingRow, locale: Locale): EventBody {
  const b = row.booking;
  const firstName = b.customerName.trim().split(/\s+/)[0] ?? "";
  return {
    id: eventId(b.id),
    summary: `${firstName} · ${serviceName(row.service, locale)}`,
    location: `${row.location.name}, ${row.location.address}`,
    start: { dateTime: b.startAt.toISOString() },
    end: { dateTime: b.endAt.toISOString() },
    extendedProperties: { private: { jakamarinkoBooking: b.id } },
  };
}

const gone = (err: unknown) => err instanceof GoogleError && (err.status === 404 || err.status === 410);
const exists = (err: unknown) => err instanceof GoogleError && err.status === 409;

async function coachLocale(coachId: string) {
  const [row] = await db().select({ locale: users.locale }).from(coaches).innerJoin(users, eq(users.id, coaches.userId)).where(eq(coaches.id, coachId));
  return row?.locale ?? "sl";
}

// Brings the booking's Google event in line with the booking: confirmed → created or moved, cancelled → deleted.
// Does nothing without a working connection. Throws GoogleError when Google fails; the caller decides what to do.
export async function syncBooking(bookingId: string) {
  const config = calendarConfig();
  if (!config) return;
  const [row] = await findBookings(eq(bookings.id, bookingId));
  if (!row) return;
  const b = row.booking;
  const conn = await connectionOf(b.coachId);
  if (conn?.status !== "connected") return;
  const [pushed] = await db().select().from(calendarEvents).where(eq(calendarEvents.bookingId, b.id));

  if (b.status === "confirmed") {
    if (pushed && pushed.startAt.getTime() === b.startAt.getTime() && pushed.endAt.getTime() === b.endAt.getTime()) return;
    // A moved booking stays in the calendar it was first written to.
    const calendarId = pushed?.calendarId ?? conn.calendarId;
    const event = eventFor(row, await coachLocale(b.coachId));
    await withGoogle(config, conn, async (token) => {
      if (pushed) await patchEvent(config, token, calendarId, event).catch((err) => (gone(err) ? insertEvent(config, token, calendarId, event) : Promise.reject(err)));
      else await insertEvent(config, token, calendarId, event).catch((err) => (exists(err) ? patchEvent(config, token, calendarId, event) : Promise.reject(err)));
    });
    const values = { bookingId: b.id, coachId: b.coachId, calendarId, startAt: b.startAt, endAt: b.endAt };
    await db().insert(calendarEvents).values(values).onConflictDoUpdate({ target: calendarEvents.bookingId, set: values });
  } else if (b.status === "cancelled" && pushed) {
    await withGoogle(config, conn, (token) =>
      deleteEvent(config, token, pushed.calendarId, eventId(b.id)).catch((err) => (gone(err) ? undefined : Promise.reject(err))),
    );
    await db().delete(calendarEvents).where(eq(calendarEvents.bookingId, b.id));
  }
}

// Called right after a booking changes. Runs in the background and never fails the booking: whatever doesn't get
// through now, the calendar-sync job picks up within 5 minutes.
export function syncSoon(bookingId: string) {
  void syncBooking(bookingId).catch((err: unknown) =>
    console.error(`calendar sync of booking ${bookingId} failed: ${err instanceof GoogleError ? err.message : loggable(err)}`),
  );
}

// Bookings whose Google event is missing, outdated or should be gone, for coaches with a working connection.
export async function unsyncedBookings(now: Date) {
  const connected = and(eq(calendarConnections.coachId, bookings.coachId), eq(calendarConnections.status, "connected"));
  const toWrite = await db()
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(calendarConnections, connected)
    .leftJoin(calendarEvents, eq(calendarEvents.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        gt(bookings.endAt, now),
        or(isNull(calendarEvents.bookingId), ne(calendarEvents.startAt, bookings.startAt), ne(calendarEvents.endAt, bookings.endAt)),
      ),
    );
  const toDelete = await db()
    .select({ id: bookings.id })
    .from(calendarEvents)
    .innerJoin(bookings, eq(bookings.id, calendarEvents.bookingId))
    .innerJoin(calendarConnections, connected)
    .where(eq(bookings.status, "cancelled"));
  return [...toWrite, ...toDelete].map((r) => r.id);
}
