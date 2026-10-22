import { randomBytes, timingSafeEqual } from "node:crypto";
import { and, asc, eq, type SQL } from "drizzle-orm";
import type { Booking, CoachBooking, CreateBookingInput, ServiceId } from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import { db } from "@jakamarinko/db";
import { bookings, locations, serviceTypes } from "@jakamarinko/db/schema";
import { syncSoon } from "../calendar/push";
import { ApiError } from "../lib/errors";
import { coachSlots, lockCoach } from "./calendar";
import type { BookingConfig } from "./config";
import { serviceName } from "./catalog";
import { localDate } from "./time";

const columns = {
  booking: bookings,
  service: serviceTypes.catalogId,
  location: { id: locations.id, name: locations.name, address: locations.address },
};

// Bookings with their service and location, oldest first.
export async function findBookings(where: SQL | undefined) {
  return db()
    .select(columns)
    .from(bookings)
    .innerJoin(serviceTypes, eq(serviceTypes.id, bookings.serviceTypeId))
    .innerJoin(locations, eq(locations.id, bookings.locationId))
    .where(where)
    .orderBy(asc(bookings.startAt));
}

export type BookingRow = Awaited<ReturnType<typeof findBookings>>[number];

export async function findBooking(id: string) {
  const [row] = await findBookings(eq(bookings.id, id));
  if (!row) throw new ApiError(404, "not_found", "Booking not found");
  return row;
}

export const cancellable = (row: BookingRow, now: Date, config: BookingConfig) =>
  (row.booking.status === "confirmed" || row.booking.status === "pending_payment") &&
  row.booking.startAt.getTime() - now.getTime() >= config.cancelMin * 60_000;

export function customerView(row: BookingRow, now: Date, config: BookingConfig): Booking {
  const b = row.booking;
  return {
    id: b.id,
    service: row.service as ServiceId,
    serviceName: serviceName(row.service, b.locale),
    status: b.status,
    paidVia: b.paidVia,
    start: b.startAt.toISOString(),
    end: b.endAt.toISOString(),
    coachId: b.coachId,
    location: row.location,
    name: b.customerName,
    email: b.customerEmail,
    phone: b.customerPhone,
    locale: b.locale,
    cancellable: cancellable(row, now, config),
  };
}

// Health answers only for the booking's own coach; anyone else on staff sees whether something was flagged.
export function coachView(row: BookingRow, viewerCoachId: string | undefined, now: Date, config: BookingConfig): CoachBooking {
  const answers = row.booking.healthAnswers;
  return {
    ...customerView(row, now, config),
    customerUserId: row.booking.customerUserId,
    healthFlag: !!answers && Object.values(answers).some((a) => a === true),
    healthAnswers: row.booking.coachId === viewerCoachId ? answers : null,
    cancelReason: row.booking.cancelReason,
  };
}

export const manageUrl = (b: BookingRow["booking"], config: BookingConfig) =>
  `${config.siteUrl}/${b.locale}/booking/${b.id}?token=${b.manageToken}`;

// The signed-in customer it belongs to, or anyone with the token from the emails.
export function mayManage(row: BookingRow, user: SessionUser | null, token: string | undefined) {
  if (user && row.booking.customerUserId === user.id) return true;
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(row.booking.manageToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Books a free slot. 409 slot_taken when it isn't free (any more): the check and the insert run under the coach's lock.
export async function createBooking(input: CreateBookingInput, user: SessionUser | null, now: Date, config: BookingConfig) {
  const [service] = await db()
    .select()
    .from(serviceTypes)
    .where(and(eq(serviceTypes.catalogId, input.service), eq(serviceTypes.active, true)));
  if (!service) throw new ApiError(404, "unknown_service", "Service not found");
  const start = new Date(input.start);

  const id = await db().transaction(async (tx) => {
    const coach = await lockCoach(tx, input.coachId);
    if (!coach?.active) throw new ApiError(404, "unknown_coach", "Coach not found");
    const day = localDate(start);
    const slots = await coachSlots(tx, coach.id, day, day, { now, config, durationMin: service.durationMin });
    const slot = slots.find((s) => s.start.getTime() === start.getTime());
    if (!slot) throw new ApiError(409, "slot_taken", "This time is no longer free");

    const confirmed = service.priceCents === 0 || !config.paymentsEnabled;
    const [row] = await tx
      .insert(bookings)
      .values({
        serviceTypeId: service.id,
        coachId: coach.id,
        locationId: slot.locationId,
        customerUserId: user?.id ?? null,
        customerName: input.name,
        customerEmail: input.email.toLowerCase(),
        customerPhone: input.phone,
        startAt: slot.start,
        endAt: slot.end,
        status: confirmed ? "confirmed" : "pending_payment",
        paidVia: "none",
        utm: (input.utm as Record<string, string> | undefined) ?? null,
        locale: input.locale,
        healthAnswers: input.healthAnswers ?? null,
        healthConsentAt: input.healthAnswers ? now : null,
        manageToken: randomBytes(24).toString("base64url"),
      })
      .returning({ id: bookings.id });
    return row!.id;
  }).catch(scrub);
  syncSoon(id);
  return findBooking(id);
}

// Drizzle puts the query's parameters, health answers included, into its error message, and the error handler logs
// the stack. Only Postgres' error code survives.
function scrub(err: unknown): never {
  if (err instanceof ApiError) throw err;
  const code = err instanceof Error && err.cause && typeof err.cause === "object" && "code" in err.cause ? err.cause.code : "unknown";
  throw new Error(`booking insert failed (postgres ${String(code)})`);
}

// Moves a booking to another free slot of the same coach, under the coach's lock. The reminder goes out again.
export async function rescheduleBooking(row: BookingRow, start: Date, now: Date, config: BookingConfig) {
  const b = row.booking;
  if (b.status !== "confirmed" && b.status !== "pending_payment") throw new ApiError(409, "not_active", "Booking is not active");
  await db().transaction(async (tx) => {
    await lockCoach(tx, b.coachId);
    const day = localDate(start);
    const durationMin = (b.endAt.getTime() - b.startAt.getTime()) / 60_000;
    const slots = await coachSlots(tx, b.coachId, day, day, { now, config, durationMin, noticeMin: 0, excludeBookingId: b.id });
    const slot = slots.find((s) => s.start.getTime() === start.getTime());
    if (!slot) throw new ApiError(409, "slot_taken", "This time is not free");
    await tx
      .update(bookings)
      .set({ startAt: slot.start, endAt: slot.end, locationId: slot.locationId, reminderSentAt: null })
      .where(eq(bookings.id, b.id));
  });
  syncSoon(b.id);
  return findBooking(b.id);
}

export async function cancelBooking(row: BookingRow, now: Date, reason?: string) {
  await db()
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: now, cancelReason: reason || null })
    .where(eq(bookings.id, row.booking.id));
  syncSoon(row.booking.id);
  return findBooking(row.booking.id);
}
