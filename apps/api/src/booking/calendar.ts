import { and, eq, gt, gte, inArray, lt, lte, ne } from "drizzle-orm";
import { db } from "@jakamarinko/db";
import { availability, availabilityExceptions, bookings, coaches, locations } from "@jakamarinko/db/schema";
import type { BookingConfig } from "./config";
import { freeSlots, type Exception } from "./slots";
import { addDays, zoned } from "./time";

// A transaction or the database itself.
export type Q = Pick<ReturnType<typeof db>, "select" | "insert" | "update">;

// Statuses that hold their time in the calendar.
export const holding = ["pending_payment", "confirmed"] as const;

type Options = {
  now: Date;
  config: BookingConfig;
  durationMin: number;
  // A coach moving a booking isn't held to the customer's minimum notice, and the booking doesn't block itself.
  noticeMin?: number;
  excludeBookingId?: string;
};

// Free slots of one coach between two Ljubljana dates (both included).
export async function coachSlots(q: Q, coachId: string, from: string, to: string, o: Options) {
  const { config } = o;
  const [rules, exceptionRows, [lab]] = await Promise.all([
    q.select().from(availability).where(eq(availability.coachId, coachId)),
    q
      .select()
      .from(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.coachId, coachId),
          lte(availabilityExceptions.startDate, to),
          gte(availabilityExceptions.endDate, from),
        ),
      ),
    q.select({ id: locations.id }).from(locations).where(eq(locations.isDefault, true)),
  ]);

  const pad = config.bufferMin * 60_000;
  const busy = await q
    .select({ start: bookings.startAt, end: bookings.endAt })
    .from(bookings)
    .where(
      and(
        eq(bookings.coachId, coachId),
        inArray(bookings.status, [...holding]),
        lt(bookings.startAt, new Date(zoned(addDays(to, 1), 0).getTime() + pad)),
        gt(bookings.endAt, new Date(zoned(from, 0).getTime() - pad)),
        o.excludeBookingId ? ne(bookings.id, o.excludeBookingId) : undefined,
      ),
    );

  const exceptions = exceptionRows.flatMap((e): Exception[] => {
    if (e.kind === "closed") return [{ kind: "closed", startDate: e.startDate, endDate: e.endDate, start: e.start, end: e.end }];
    const locationId = e.locationId ?? lab?.id;
    return locationId ? [{ kind: "open", startDate: e.startDate, endDate: e.endDate, start: e.start!, end: e.end!, locationId }] : [];
  });

  return freeSlots({
    from,
    to,
    now: o.now,
    rules,
    exceptions,
    busy,
    durationMin: o.durationMin,
    bufferMin: config.bufferMin,
    noticeMin: o.noticeMin ?? config.noticeMin,
    horizonDays: config.horizonDays,
    stepMin: config.stepMin,
  });
}

export const activeCoachIds = async (q: Q) =>
  (await q.select({ id: coaches.id }).from(coaches).where(eq(coaches.active, true))).map((c) => c.id);

// Locks the coach's row until the transaction ends, so two bookings for the same coach are checked and written
// one after the other. Together with the slot check inside the same transaction, this is what stops double-booking.
export async function lockCoach(q: Q, coachId: string) {
  const [coach] = await q.select({ id: coaches.id, active: coaches.active }).from(coaches).where(eq(coaches.id, coachId)).for("update");
  return coach;
}
