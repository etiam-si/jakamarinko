import { z } from "zod";
import { labTestIds, locales, sessionIds } from "@jakamarinko/types";
import { Attribution } from "./events";

// Services are named by their catalog id (packages/types), e.g. ?service=performance.
export const ServiceId = z.enum([...labTestIds, ...sessionIds]);
export type ServiceId = z.infer<typeof ServiceId>;

export const BookingStatus = z.enum(["pending_payment", "confirmed", "cancelled", "completed", "no_show"]);
export type BookingStatus = z.infer<typeof BookingStatus>;
export const PaidVia = z.enum(["stripe", "credit", "none"]);

// Ljubljana local dates and times: YYYY-MM-DD and HH:MM (24:00 only as an end).
const LocalDate = z.iso.date();
const LocalTime = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, "HH:MM");
const Instant = z.iso.datetime({ offset: true });

// GET /api/booking/services?locale=
export const ServicesQuery = z.object({ locale: z.enum(locales).default("en") });
export const Service = z.object({
  id: ServiceId,
  kind: z.enum(["lab_test", "session"]),
  durationMin: z.number(),
  priceCents: z.number(),
  name: z.string(),
  description: z.string(),
  preparation: z.array(z.string()),
});
export type Service = z.infer<typeof Service>;

const maxSlotDays = 62;
const days = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000;

// GET /api/booking/slots?service&from&to: from and to are Ljubljana dates, both included.
export const SlotsQuery = z
  .object({ service: ServiceId, from: LocalDate, to: LocalDate })
  .refine((q) => days(q.from, q.to) >= 0 && days(q.from, q.to) <= maxSlotDays, {
    path: ["to"],
    message: `from..to must be 0 to ${maxSlotDays} days`,
  });
export const Slot = z.object({ start: Instant, end: Instant, coachId: z.string(), locationId: z.string() });
export type Slot = z.infer<typeof Slot>;

// PAR-Q-style answers (T11 owns the questions): question key → yes/no or a short text. Health data.
export const HealthAnswers = z
  .record(z.string().regex(/^[a-z0-9_]{1,40}$/), z.union([z.boolean(), z.string().max(500)]))
  .refine((a) => Object.keys(a).length <= 30, "too many answers");
export type HealthAnswers = z.infer<typeof HealthAnswers>;

// POST /api/booking, guest or signed in. coachId and start come from a slot.
export const CreateBookingInput = z
  .object({
    service: ServiceId,
    coachId: z.uuid(),
    start: Instant,
    name: z.string().trim().min(1).max(200),
    email: z.email().max(320),
    phone: z.string().trim().min(6).max(30),
    locale: z.enum(locales),
    healthAnswers: HealthAnswers.optional(),
    // The customer agreed to the processing of their health data; required with healthAnswers.
    healthConsent: z.boolean().optional(),
    utm: Attribution.optional(),
    // An offer code from the review step (offers); case-insensitive.
    code: z.string().trim().max(40).optional(),
  })
  .refine((b) => !b.healthAnswers || b.healthConsent === true, {
    path: ["healthConsent"],
    message: "required with healthAnswers",
  });
export type CreateBookingInput = z.infer<typeof CreateBookingInput>;

// What a customer sees of their booking.
export const Booking = z.object({
  id: z.string(),
  service: ServiceId,
  serviceName: z.string(),
  status: BookingStatus,
  paidVia: PaidVia,
  start: Instant,
  end: Instant,
  coachId: z.string(),
  location: z.object({ id: z.string(), name: z.string(), address: z.string() }),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  locale: z.enum(locales),
  // Free cancellation is still possible (until 24 h before).
  cancellable: z.boolean(),
  // What the booking costs, after an offer code or the founding discount.
  priceCents: z.number(),
});
export type Booking = z.infer<typeof Booking>;

// POST /api/booking returns the booking and the link from the emails (it works without signing in).
export const CreatedBooking = z.object({ booking: Booking, manageUrl: z.url() });
export type CreatedBooking = z.infer<typeof CreatedBooking>;

// GET /api/booking/:id and POST /api/booking/:id/cancel: a guest passes the token from their link.
export const ManageQuery = z.object({ token: z.string().optional() });

// Coach routes. coachId picks whose calendar: a coach may only name their own, head_coach and owner anyone's.
export const CoachQuery = z.object({ coachId: z.uuid().optional() });

const ordered = (r: { start?: string | null; end?: string | null }) => !r.start || !r.end || r.end > r.start;

export const AvailabilityInput = z
  .object({
    coachId: z.uuid().optional(),
    weekday: z.number().int().min(1).max(7),
    start: LocalTime,
    end: LocalTime,
    locationId: z.uuid(),
  })
  .refine(ordered, { path: ["end"], message: "end must be after start" });
export type AvailabilityInput = z.infer<typeof AvailabilityInput>;
export const Availability = z.object({
  id: z.string(),
  coachId: z.string(),
  weekday: z.number(),
  start: LocalTime,
  end: LocalTime,
  locationId: z.string(),
});
export type Availability = z.infer<typeof Availability>;

// closed without start/end closes whole days; open needs hours and uses the default location unless one is given.
export const ExceptionInput = z
  .object({
    coachId: z.uuid().optional(),
    startDate: LocalDate,
    endDate: LocalDate,
    kind: z.enum(["closed", "open"]),
    start: LocalTime.nullish(),
    end: LocalTime.nullish(),
    locationId: z.uuid().nullish(),
    note: z.string().max(200).nullish(),
  })
  .refine((e) => e.endDate >= e.startDate, { path: ["endDate"], message: "endDate must not be before startDate" })
  .refine((e) => !e.start === !e.end, { path: ["end"], message: "start and end go together" })
  .refine((e) => e.kind === "closed" || !!e.start, { path: ["start"], message: "open needs start and end" })
  .refine(ordered, { path: ["end"], message: "end must be after start" });
export type ExceptionInput = z.infer<typeof ExceptionInput>;
export const AvailabilityException = z.object({
  id: z.string(),
  coachId: z.string(),
  startDate: LocalDate,
  endDate: LocalDate,
  kind: z.enum(["closed", "open"]),
  start: LocalTime.nullable(),
  end: LocalTime.nullable(),
  locationId: z.string().nullable(),
  note: z.string().nullable(),
});
export type AvailabilityException = z.infer<typeof AvailabilityException>;

// GET /api/booking/coach/bookings?from&to: Ljubljana dates, both included.
export const CoachBookingsQuery = z
  .object({ coachId: z.uuid().optional(), from: LocalDate, to: LocalDate })
  .refine((q) => days(q.from, q.to) >= 0 && days(q.from, q.to) <= 366, { path: ["to"], message: "from..to must be 0 to 366 days" });

// The coach's view. healthFlag: some question was answered yes. The answers themselves only for the booking's own coach.
export const CoachBooking = Booking.extend({
  customerUserId: z.string().nullable(),
  healthFlag: z.boolean(),
  healthAnswers: HealthAnswers.nullable(),
  cancelReason: z.string().nullable(),
});
export type CoachBooking = z.infer<typeof CoachBooking>;

// GET /api/booking/coach/coaches: the calendars the signed-in coach may open, for the switcher (?coach=<id>).
// id is the coach id (coaches.id), the one every coachId means; own marks the caller's calendar.
export const CoachSummary = z.object({ id: z.string(), name: z.string(), own: z.boolean() });
export type CoachSummary = z.infer<typeof CoachSummary>;

// GET /api/booking/coach/locations: where availability can be.
export const Location = z.object({ id: z.string(), name: z.string(), address: z.string(), isDefault: z.boolean() });
export type Location = z.infer<typeof Location>;

// GET /api/booking/coach/bookings/:id/slots?from&to: free times this booking can move to (its coach, its length).
export const RescheduleSlotsQuery = z
  .object({ from: LocalDate, to: LocalDate })
  .refine((q) => days(q.from, q.to) >= 0 && days(q.from, q.to) <= maxSlotDays, {
    path: ["to"],
    message: `from..to must be 0 to ${maxSlotDays} days`,
  });

export const CoachCancelInput = z.object({ reason: z.string().trim().max(500).optional() });
export const RescheduleInput = z.object({ start: Instant });
export const OutcomeInput = z.object({ status: z.enum(["completed", "no_show"]) });
