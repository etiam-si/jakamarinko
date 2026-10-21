# T12 Coach: availability and bookings

**Goal:** Jaka manages his calendar and bookings from his phone, without asking anyone.

**Depends on:** T07, T10. **Blocks:** T16.

**Owns:** `apps/web/src/app/[locale]/(app)/coach/{today,bookings,settings/availability}/`, `apps/web/src/components/coach-booking/`, `apps/web/messages/{en,sl}/coach-booking.json`.

## Build
1. **Today:** today's and tomorrow's bookings, with customer, service, location, health questionnaire flags (only the flags in the list, details on click), and buttons to call or email.
2. **Bookings:** week and list views; filter by status and service; actions cancel (with reason; emails the customer), reschedule (picks a free slot; emails the customer), mark completed or no-show.
3. **Availability:** a weekly template editor (per weekday: time ranges + location) and exceptions (holidays, extra days) on a calendar.
4. A head coach or owner can switch whose calendar they edit (T10's switcher).

## Acceptance criteria
- [ ] Playwright: the coach closes next Monday via an exception → that day has no slots in the public flow.
- [ ] Playwright: the coach reschedules a booking → the customer gets a "rescheduled" email with the new time and `.ics`.
- [ ] Every screen works at 375 px (screenshots in the PR).
- [ ] Health questionnaire details are shown only to coaches of that booking (API test).

## Out of scope
Google Calendar sync (T16).

## Needs from the user
Nothing.
