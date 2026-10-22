import { and, desc, eq, gte, lt } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  AvailabilityInput,
  CoachBookingsQuery,
  CoachCancelInput,
  CoachQuery,
  CreateBookingInput,
  ExceptionInput,
  type Location,
  ManageQuery,
  OutcomeInput,
  RescheduleInput,
  RescheduleSlotsQuery,
  ServicesQuery,
  SlotsQuery,
  roleAllows,
  type Availability,
  type AvailabilityException,
  type Booking,
  type CoachBooking,
  type CoachSummary,
  type CreatedBooking,
  type Service,
  type Slot,
} from "@jakamarinko/api";
import { getSessionUser, type SessionUser } from "@jakamarinko/auth";
import { db } from "@jakamarinko/db";
import { availability, availabilityExceptions, bookings, coaches, locations, serviceTypes, users } from "@jakamarinko/db/schema";
import {
  cancelBooking,
  cancellable,
  coachView,
  createBooking,
  customerView,
  findBooking,
  findBookings,
  manageUrl,
  mayManage,
  rescheduleBooking,
} from "../booking/bookings";
import { activeCoachIds, coachSlots } from "../booking/calendar";
import { freshenBusy } from "../calendar/busy";
import { bookable, serviceView } from "../booking/catalog";
import { assertCoachAccess, ownCoachId, targetCoach } from "../booking/coach";
import { bookingConfig } from "../booking/config";
import { sendCancelled, sendConfirmed, sendRescheduled } from "../booking/emails";
import { recordConversion, reportBookingPaid } from "../conversions/record";
import { addDays, zoned } from "../booking/time";
import { requireRole, requireSession } from "../lib/auth";
import { settleCancelled } from "../payments/refunds";
import { ApiError } from "../lib/errors";
import { validate } from "../lib/validate";

const IdParam = z.object({ id: z.uuid() });
const staff = requireRole("coach");
const hhmm = (time: string) => time.slice(0, 5);

async function activeService(catalogId: string) {
  const [service] = await db()
    .select()
    .from(serviceTypes)
    .where(and(eq(serviceTypes.catalogId, catalogId), eq(serviceTypes.active, true)));
  if (!service) throw new ApiError(404, "unknown_service", "Service not found");
  return service;
}

async function assertLocation(id: string | null | undefined) {
  if (!id) return;
  const [found] = await db().select({ id: locations.id }).from(locations).where(eq(locations.id, id));
  if (!found) throw new ApiError(400, "unknown_location", "Location not found");
}

const availabilityView = (r: typeof availability.$inferSelect): Availability => ({
  id: r.id,
  coachId: r.coachId,
  weekday: r.weekday,
  start: hhmm(r.start),
  end: hhmm(r.end),
  locationId: r.locationId,
});

const exceptionView = (r: typeof availabilityExceptions.$inferSelect): AvailabilityException => ({
  id: r.id,
  coachId: r.coachId,
  startDate: r.startDate,
  endDate: r.endDate,
  kind: r.kind,
  start: r.start && hhmm(r.start),
  end: r.end && hhmm(r.end),
  locationId: r.locationId,
  note: r.note,
});

// 404 when the row is missing, 403 when it is on someone else's calendar.
async function assertRowAccess(rows: { coachId: string }[], user: SessionUser) {
  if (!rows[0]) throw new ApiError(404, "not_found", "Not found");
  await assertCoachAccess(user, rows[0].coachId);
}

const availabilityOwner = (id: string) =>
  db().select({ coachId: availability.coachId }).from(availability).where(eq(availability.id, id));
const exceptionOwner = (id: string) =>
  db().select({ coachId: availabilityExceptions.coachId }).from(availabilityExceptions).where(eq(availabilityExceptions.id, id));

// A coach's calendar: availability, exceptions and bookings. Customers and guests never reach these.
const coach = new Hono()
  // Whose calendar the switcher offers: a coach only their own, head coach and owner every active coach. Own first.
  .get("/coaches", staff, async (c) => {
    const user = c.get("user");
    const rows = await db()
      .select({ id: coaches.id, userId: coaches.userId, name: users.name, email: users.email })
      .from(coaches)
      .innerJoin(users, eq(users.id, coaches.userId))
      .where(roleAllows(user.role, ["head_coach"]) ? eq(coaches.active, true) : eq(coaches.userId, user.id))
      .orderBy(users.name);
    const list = rows.map((r) => ({ id: r.id, name: r.name || r.email, own: r.userId === user.id }));
    return c.json<CoachSummary[]>([...list.filter((r) => r.own), ...list.filter((r) => !r.own)]);
  })
  .get("/locations", staff, async (c) => {
    const rows = await db().select().from(locations).orderBy(desc(locations.isDefault), locations.name);
    return c.json<Location[]>(rows.map((r) => ({ id: r.id, name: r.name, address: r.address, isDefault: r.isDefault })));
  })
  .get("/availability", staff, validate("query", CoachQuery), async (c) => {
    const coachId = await targetCoach(c.get("user"), c.req.valid("query").coachId);
    const rows = await db().select().from(availability).where(eq(availability.coachId, coachId)).orderBy(availability.weekday, availability.start);
    return c.json<Availability[]>(rows.map(availabilityView));
  })
  .post("/availability", staff, validate("json", AvailabilityInput), async (c) => {
    const { coachId: requested, ...input } = c.req.valid("json");
    const coachId = await targetCoach(c.get("user"), requested);
    await assertLocation(input.locationId);
    const [row] = await db().insert(availability).values({ ...input, coachId }).returning();
    return c.json<Availability>(availabilityView(row!), 201);
  })
  .put("/availability/:id", staff, validate("param", IdParam), validate("json", AvailabilityInput), async (c) => {
    const { id } = c.req.valid("param");
    await assertRowAccess(await availabilityOwner(id), c.get("user"));
    const { coachId: _, ...input } = c.req.valid("json");
    await assertLocation(input.locationId);
    const [row] = await db().update(availability).set(input).where(eq(availability.id, id)).returning();
    return c.json<Availability>(availabilityView(row!));
  })
  .delete("/availability/:id", staff, validate("param", IdParam), async (c) => {
    const { id } = c.req.valid("param");
    await assertRowAccess(await availabilityOwner(id), c.get("user"));
    await db().delete(availability).where(eq(availability.id, id));
    return c.body(null, 204);
  })
  .get("/exceptions", staff, validate("query", CoachQuery), async (c) => {
    const coachId = await targetCoach(c.get("user"), c.req.valid("query").coachId);
    const rows = await db()
      .select()
      .from(availabilityExceptions)
      .where(eq(availabilityExceptions.coachId, coachId))
      .orderBy(availabilityExceptions.startDate);
    return c.json<AvailabilityException[]>(rows.map(exceptionView));
  })
  .post("/exceptions", staff, validate("json", ExceptionInput), async (c) => {
    const { coachId: requested, ...input } = c.req.valid("json");
    const coachId = await targetCoach(c.get("user"), requested);
    await assertLocation(input.locationId);
    const [row] = await db().insert(availabilityExceptions).values({ ...input, coachId }).returning();
    return c.json<AvailabilityException>(exceptionView(row!), 201);
  })
  .put("/exceptions/:id", staff, validate("param", IdParam), validate("json", ExceptionInput), async (c) => {
    const { id } = c.req.valid("param");
    await assertRowAccess(await exceptionOwner(id), c.get("user"));
    const { coachId: _, ...input } = c.req.valid("json");
    await assertLocation(input.locationId);
    const values = { start: null, end: null, locationId: null, note: null, ...input };
    const [row] = await db().update(availabilityExceptions).set(values).where(eq(availabilityExceptions.id, id)).returning();
    return c.json<AvailabilityException>(exceptionView(row!));
  })
  .delete("/exceptions/:id", staff, validate("param", IdParam), async (c) => {
    const { id } = c.req.valid("param");
    await assertRowAccess(await exceptionOwner(id), c.get("user"));
    await db().delete(availabilityExceptions).where(eq(availabilityExceptions.id, id));
    return c.body(null, 204);
  })
  .get("/bookings", staff, validate("query", CoachBookingsQuery), async (c) => {
    const { coachId: requested, from, to } = c.req.valid("query");
    const user = c.get("user");
    const coachId = await targetCoach(user, requested);
    const rows = await findBookings(
      and(eq(bookings.coachId, coachId), gte(bookings.startAt, zoned(from, 0)), lt(bookings.startAt, zoned(addDays(to, 1), 0))),
    );
    const own = await ownCoachId(user);
    const now = new Date();
    return c.json<CoachBooking[]>(rows.map((r) => coachView(r, own, now, bookingConfig())));
  })
  .post("/bookings/:id/cancel", staff, validate("param", IdParam), validate("json", CoachCancelInput), async (c) => {
    const row = await findBooking(c.req.valid("param").id);
    const user = c.get("user");
    await assertCoachAccess(user, row.booking.coachId);
    if (row.booking.status !== "confirmed" && row.booking.status !== "pending_payment") {
      throw new ApiError(409, "not_active", "Booking is not active");
    }
    const { reason } = c.req.valid("json");
    const config = bookingConfig();
    const now = new Date();
    const cancelled = await cancelBooking(row, now, reason);
    await settleCancelled(row, "coach", now, config);
    await sendCancelled(cancelled, config, reason);
    return c.json<CoachBooking>(coachView(cancelled, await ownCoachId(user), now, config));
  })
  .get("/bookings/:id/slots", staff, validate("param", IdParam), validate("query", RescheduleSlotsQuery), async (c) => {
    const { booking: b } = await findBooking(c.req.valid("param").id);
    await assertCoachAccess(c.get("user"), b.coachId);
    const { from, to } = c.req.valid("query");
    const durationMin = (b.endAt.getTime() - b.startAt.getTime()) / 60_000;
    const options = { now: new Date(), config: bookingConfig(), durationMin, noticeMin: 0, excludeBookingId: b.id };
    await freshenBusy([b.coachId]);
    const slots = await coachSlots(db(), b.coachId, from, to, options);
    return c.json<Slot[]>(
      slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString(), coachId: b.coachId, locationId: s.locationId })),
    );
  })
  .post("/bookings/:id/reschedule", staff, validate("param", IdParam), validate("json", RescheduleInput), async (c) => {
    const row = await findBooking(c.req.valid("param").id);
    const user = c.get("user");
    await assertCoachAccess(user, row.booking.coachId);
    const config = bookingConfig();
    const now = new Date();
    const moved = await rescheduleBooking(row, new Date(c.req.valid("json").start), now, config);
    if (moved.booking.status === "confirmed") await sendRescheduled(moved, row.booking.startAt, now, config);
    return c.json<CoachBooking>(coachView(moved, await ownCoachId(user), now, config));
  })
  .post("/bookings/:id/outcome", staff, validate("param", IdParam), validate("json", OutcomeInput), async (c) => {
    const row = await findBooking(c.req.valid("param").id);
    const user = c.get("user");
    await assertCoachAccess(user, row.booking.coachId);
    const now = new Date();
    if (row.booking.status !== "confirmed") throw new ApiError(409, "not_active", "Only a confirmed booking has an outcome");
    if (row.booking.startAt > now) throw new ApiError(409, "not_started", "The booking hasn't started yet");
    await db().update(bookings).set({ status: c.req.valid("json").status }).where(eq(bookings.id, row.booking.id));
    return c.json<CoachBooking>(coachView(await findBooking(row.booking.id), await ownCoachId(user), now, bookingConfig()));
  });

export const booking = new Hono()
  .get("/services", validate("query", ServicesQuery), async (c) => {
    const { locale } = c.req.valid("query");
    const rows = await db().select().from(serviceTypes).where(eq(serviceTypes.active, true));
    const order = bookable.map((s) => s.id as string);
    const services = rows
      .filter((r) => order.includes(r.catalogId))
      .sort((a, b) => order.indexOf(a.catalogId) - order.indexOf(b.catalogId))
      .map((r) => serviceView(r, locale));
    return c.json<Service[]>(services);
  })
  .get("/slots", validate("query", SlotsQuery), async (c) => {
    const { service, from, to } = c.req.valid("query");
    const { durationMin } = await activeService(service);
    const config = bookingConfig();
    const now = new Date();
    const coachIds = await activeCoachIds(db());
    await freshenBusy(coachIds);
    const perCoach = await Promise.all(
      coachIds.map(async (coachId) =>
        (await coachSlots(db(), coachId, from, to, { now, config, durationMin })).map((s) => ({ ...s, coachId })),
      ),
    );
    const slots = perCoach.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
    return c.json<Slot[]>(
      slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString(), coachId: s.coachId, locationId: s.locationId })),
    );
  })
  .post("/", validate("json", CreateBookingInput), async (c) => {
    const user = await getSessionUser(c.req.raw.headers);
    const config = bookingConfig();
    const now = new Date();
    const row = await createBooking(c.req.valid("json"), user, now, config);
    // The Purchase goes to Meta once the booking is paid (T13's webhook), or now when it is confirmed straight away.
    await recordConversion(c, "booking_paid", { bookingId: row.booking.id });
    if (row.booking.status === "confirmed") {
      await sendConfirmed(row, config);
      await reportBookingPaid(row.booking.id);
    }
    return c.json<CreatedBooking>({ booking: customerView(row, now, config), manageUrl: manageUrl(row.booking, config) }, 201);
  })
  .get("/mine", requireSession, async (c) => {
    const rows = await findBookings(eq(bookings.customerUserId, c.get("user").id));
    const now = new Date();
    return c.json<Booking[]>(rows.map((r) => customerView(r, now, bookingConfig())));
  })
  .route("/coach", coach)
  .get("/:id", validate("param", IdParam), validate("query", ManageQuery), async (c) => {
    const row = await findBooking(c.req.valid("param").id);
    // Someone else's booking looks the same as a missing one.
    if (!mayManage(row, await getSessionUser(c.req.raw.headers), c.req.valid("query").token)) {
      throw new ApiError(404, "not_found", "Booking not found");
    }
    return c.json<Booking>(customerView(row, new Date(), bookingConfig()));
  })
  .post("/:id/cancel", validate("param", IdParam), validate("query", ManageQuery), async (c) => {
    const row = await findBooking(c.req.valid("param").id);
    if (!mayManage(row, await getSessionUser(c.req.raw.headers), c.req.valid("query").token)) {
      throw new ApiError(404, "not_found", "Booking not found");
    }
    const config = bookingConfig();
    const now = new Date();
    if (row.booking.status !== "confirmed" && row.booking.status !== "pending_payment") {
      throw new ApiError(409, "not_active", "Booking is not active");
    }
    if (!cancellable(row, now, config)) throw new ApiError(409, "too_late", `Free cancellation ends ${config.cancelMin / 60} hours before`);
    const cancelled = await cancelBooking(row, now);
    await settleCancelled(row, "customer", now, config);
    await sendCancelled(cancelled, config);
    return c.json<Booking>(customerView(cancelled, now, config));
  });
