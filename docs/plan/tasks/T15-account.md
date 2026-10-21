# T15 Customer account

**Goal:** a customer sees and manages their bookings, language and privacy, including GDPR export and deletion.

**Depends on:** T07, T10.

**Owns:** `apps/web/src/app/[locale]/(app)/account/{bookings,profile,privacy}/`, `apps/web/src/components/account/`, `apps/api/src/routes/account.ts`, `packages/api/src/account.ts`, `apps/web/messages/{en,sl}/account.json`.

## Build
1. **Bookings:** upcoming and past; cancel up to 24 h before (T07 rule); add to calendar.
2. **Guest bookings join the account:** bookings made as a guest with the same, verified email show up after sign-in.
3. **Profile:** name, phone, language (changes emails and UI).
4. **Privacy:**
   - Consents with the date each was granted; withdraw or re-grant. Withdrawing health-data consent explains what stops working.
   - **Export:** a JSON + CSV zip of everything about the user (`GET /api/account/export`).
   - **Delete account:** confirm by email link. Deletes personal data; keeps anonymised booking rows for accounting with the name and email removed. A test lists what is kept and why.

## Acceptance criteria
- [ ] Playwright: book as a guest → sign in with the same email → the booking is listed.
- [ ] Export contains bookings, consents, profile; a test checks the shape.
- [ ] After deletion, sign-in with that email creates a fresh empty account. Old bookings show "deleted user" to the coach.
- [ ] API tests: export and delete only for the signed-in user themselves.

## Out of scope
Subscriptions and lab results (later phases).

## Needs from the user
How long accounting records must be kept (default: 10 years for invoices in Slovenia; confirm).
