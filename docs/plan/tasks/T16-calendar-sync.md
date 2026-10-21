# T16 Google Calendar sync for coaches

**Goal:** a coach's bookings appear in their Google Calendar, and busy times in Google block slots, so Jaka never double-books his private life.

**Depends on:** T12.

**Owns:** `packages/db/src/schema/calendar.ts`, `apps/api/src/calendar/`, `apps/api/src/jobs/calendar-sync.ts`, `apps/web/src/app/[locale]/(app)/coach/settings/calendar/`, `apps/web/messages/{en,sl}/calendar.json`.

## Build
1. Connect Google Calendar (OAuth, calendar scope) in coach settings; choose which calendar receives bookings.
2. **Push:** booking confirmed, rescheduled or cancelled → an event is created, updated or deleted (customer first name + service only; no health data).
3. **Pull:** free/busy from the connected calendar is read (worker job every 5 min, plus on demand when slots are requested) and blocks those slots.
4. Disconnect removes the tokens.

## Acceptance criteria
- [ ] With a test Google account: book → the event appears; cancel → it disappears.
- [ ] A private busy event at 10:00 makes the 10:00 slot unavailable within 5 min.
- [ ] No health data or email address appears in the calendar event (test on the event payload).
- [ ] Revoked access in Google → the coach sees "reconnect", and booking keeps working without sync.

## Out of scope
Outlook/Apple calendars.

## Needs from the user
The Google OAuth client from T03 gets the calendar scope; possibly Google verification for that scope.
