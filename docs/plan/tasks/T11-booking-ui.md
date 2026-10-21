# T11 Booking flow

**Goal:** a customer books a lab test or session in under a minute, in EN or SL, on a phone.

**Depends on:** T05 (attribution, `track`), T07 (API), T08 (site layout). **Blocks:** T13, T14.

**Owns:** `apps/web/src/app/[locale]/(site)/booking/`, `apps/web/src/components/booking/`, `apps/web/messages/{en,sl}/booking.json`.

## Build
1. **Steps** (one page, step by step, state in the URL so the back button works):
   1. Service (preselected from `?service=`)
   2. Date and time (slots from the API, in Europe/Ljubljana time and shown so)
   3. Details: name, email, phone, a short health questionnaire for lab tests (PAR-Q-style questions; any "yes" shows a note to consult a doctor first), consent to processing health data, terms accepted
   4. Review
   5. Confirmed: summary, "add to calendar", preparation instructions, and the offer to create an account
2. Guests can book without an account. A signed-in user gets their details prefilled.
3. `getAttribution()` (T05) is sent with the booking. `track("booking_started")` at step 2 and `track("booking_paid")` on confirmation (T13 moves it to after payment).
4. **Errors:** a slot taken in the meantime (409) → pick another, keeping the details; the API is down → a clear message with phone and email as the fallback.
5. Accessible: keyboard only, screen-reader labels, visible focus.

## Acceptance criteria
- [ ] Playwright, both languages, at 375 px: book the Performance package as a guest → confirmation page → confirmation email in `.emails/` in the same language.
- [ ] Playwright: two browsers pick the same slot; the second gets the "slot taken" step and keeps the entered details.
- [ ] A health question answered "yes" shows the doctor note and still allows booking.
- [ ] axe-core check passes on every step.
- [ ] Time shown = time in the email = time in the `.ics`, across a DST change date.

## Out of scope
Payment (T13). Account creation beyond the offer link.

## Needs from the user
The health questionnaire wording, to be reviewed by Jaka (draft it from standard PAR-Q).
