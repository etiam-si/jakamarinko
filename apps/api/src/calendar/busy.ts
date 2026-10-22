import { and, eq, inArray } from "drizzle-orm";
import { db } from "@jakamarinko/db";
import { calendarConnections, calendarEvents } from "@jakamarinko/db/schema";
import type { Q } from "../booking/calendar";
import type { Interval } from "../booking/slots";
import { loggable } from "../lib/errors";
import { calendarConfig, type CalendarConfig } from "./config";
import { withGoogle, type Connection } from "./connection";
import { freeBusy, GoogleError } from "./google";

export const busyMaxAgeMs = 5 * 60_000;

// Reads the coach's busy times from Google (primary calendar and the one bookings go to) from now to the end of the
// booking horizon, and keeps them on the connection.
export async function refreshBusy(config: CalendarConfig, conn: Connection, now = new Date()) {
  const to = new Date(now.getTime() + (config.horizonDays + 1) * 86_400_000);
  const ids = [...new Set(["primary", conn.calendarId])];
  const blocks = await withGoogle(config, conn, (token) => freeBusy(config, token, ids, now, to), now);
  const busy = blocks
    .map((b) => ({ start: new Date(b.start).toISOString(), end: new Date(b.end).toISOString() }))
    .sort((a, b) => a.start.localeCompare(b.start));
  await db()
    .update(calendarConnections)
    .set({ busy, busyFetchedAt: now })
    .where(and(eq(calendarConnections.coachId, conn.coachId), eq(calendarConnections.status, "connected")));
}

// One refresh per coach at a time, however many slot requests ask for it.
const running = new Map<string, Promise<void>>();

function refreshOnce(config: CalendarConfig, conn: Connection, now: Date) {
  let run = running.get(conn.coachId);
  if (!run) {
    run = refreshBusy(config, conn, now)
      .catch((err: unknown) => console.error(`calendar busy times not read: ${err instanceof GoogleError ? err.message : loggable(err)}`))
      .finally(() => running.delete(conn.coachId));
    running.set(conn.coachId, run);
  }
  return run;
}

// On demand, before slots are worked out: busy times older than 5 minutes are read again. If Google is slow or
// down, the slots use the last copy (each call gives up after a few seconds).
export async function freshenBusy(coachIds: string[], now = new Date()) {
  const config = calendarConfig();
  if (!config || !coachIds.length) return;
  const rows = await db()
    .select()
    .from(calendarConnections)
    .where(and(inArray(calendarConnections.coachId, coachIds), eq(calendarConnections.status, "connected")));
  const stale = rows.filter((r) => !r.busyFetchedAt || now.getTime() - r.busyFetchedAt.getTime() >= busyMaxAgeMs);
  await Promise.all(stale.map((conn) => refreshOnce(config, conn, now)));
}

// The parts of `block` outside `hole`.
export function cut(block: Interval, hole: Interval): Interval[] {
  if (hole.end <= block.start || hole.start >= block.end) return [block];
  return [
    ...(hole.start > block.start ? [{ start: block.start, end: hole.start }] : []),
    ...(hole.end < block.end ? [{ start: hole.end, end: block.end }] : []),
  ];
}

// Busy times from Google that block this coach's slots, from the copy kept on the connection. Our own events are busy
// time in Google too; they match bookings that block anyway, except the booking being moved, whose event is cut out.
export async function googleBusy(q: Q, coachId: string, excludeBookingId?: string): Promise<Interval[]> {
  if (!calendarConfig()) return [];
  const [conn] = await q
    .select({ busy: calendarConnections.busy, status: calendarConnections.status })
    .from(calendarConnections)
    .where(eq(calendarConnections.coachId, coachId));
  if (conn?.status !== "connected") return [];
  let blocks = conn.busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
  if (excludeBookingId) {
    const [own] = await q.select().from(calendarEvents).where(eq(calendarEvents.bookingId, excludeBookingId));
    if (own) blocks = blocks.flatMap((b) => cut(b, { start: own.startAt, end: own.endAt }));
  }
  return blocks;
}
