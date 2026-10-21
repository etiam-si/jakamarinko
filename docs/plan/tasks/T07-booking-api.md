# T07 Booking backend

**Goal:** the API that lets a customer book a lab test or session in a free slot of a coach, and keeps everyone informed by email.

**Depends on:** T02 (catalog), T03 (users, coaches, locations), T06 (emails). **Blocks:** T11, T12, T15, T13.

**Owns:** `packages/db/src/schema/booking.ts`, `packages/api/src/booking.ts`, `apps/api/src/routes/booking.ts`, `apps/api/src/booking/` (logic), `apps/api/src/jobs/booking-reminders.ts`.

## Build
1. **Tables:**
   - `service_types`: kind `lab_test | session`, catalog id, duration, price, active. Seeded and updated from the T02 catalog by an idempotent seed.
   - `availability`: coach, weekday, start, end, location.
   - `availability_exceptions`: coach, date range, closed or extra hours.
   - `bookings`: service type, coach, location, customer user or guest name/email/phone, start, end, status `pending_payment | confirmed | cancelled | completed | no_show`, `paid_via` `stripe | credit | none`, Stripe ids (nullable for T13), `utm` jsonb, locale, health questionnaire answers (jsonb, health data).
2. **Slot calculation:** a pure function taking availability, exceptions, existing bookings, service duration, a buffer between bookings (env, default 15 min), a minimum notice (default 24 h) and a horizon (default 60 days), and returning free slots.
   - All times in **Europe/Ljubljana**, stored in UTC. Correct across DST changes.
   - Heavily unit-tested.
3. **Public routes:**
   - `GET /api/booking/services` (by locale)
   - `GET /api/booking/slots?service&from&to`
   - `POST /api/booking`: guest or signed-in. Validated with Zod. Creates `confirmed` when the price is 0 or payment is disabled, otherwise `pending_payment`. **Double-booking is prevented in the database** (exclusion constraint or a transaction with a lock), not only in code.
   - `POST /api/booking/:id/cancel` (by the customer, up to 24 h before)
4. **Coach routes** (`requireRole("coach")`): availability and exceptions CRUD for their own calendar (head_coach and owner: anyone's), list bookings by range, cancel, reschedule, mark completed or no-show.
5. **Emails** via T06: confirmation + preparation on confirm, a reminder 24 h before (worker job, idempotent: never sends twice), and cancellation.
6. While payments are off (until T13), bookings are `confirmed` with `paid_via = none` and the email says "pay on site".

## Acceptance criteria
- [ ] Slot unit tests cover: a DST change day; an exception closing a day; a booking blocking overlapping slots plus the buffer; minimum notice; the horizon.
- [ ] A concurrency test: 10 parallel `POST /api/booking` for the same slot give exactly 1 success and 9 × 409.
- [ ] API tests: a customer can't see others' bookings; a coach can't edit another coach's availability; head_coach can.
- [ ] The reminder job run twice sends one email (checked in `.emails/`).
- [ ] Health questionnaire answers never appear in logs (a test greps the captured log output).

## Out of scope
UI (T11, T12), payments (T13), calendar sync (T16).

## Needs from the user
Jaka's weekly availability for the seed, and confirmation of the 24 h cancellation rule, the 15 min buffer and the 24 h minimum notice.
