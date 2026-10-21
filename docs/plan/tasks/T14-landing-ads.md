# T14 Ad landing pages + conversion events

**Goal:** pages built for ad traffic, and conversions reported back to Meta and Google, so it's clear which ads bring paying customers.

**Depends on:** T05, T08, T13.

**Owns:** `apps/web/src/app/[locale]/(site)/lp/`, `apps/web/src/components/landing/`, `apps/api/src/conversions/`, `apps/web/messages/{en,sl}/landing.json`.

## Build
1. **Landing pages** `/[locale]/lp/<slug>`: lab tests, Performance package, Coaching, race preparation.
   - One offer, one action, proof, FAQ, price. No main nav (only the logo and the language switch).
   - Built from blocks, so a new landing page is a config entry, not new code.
   - Not in the sitemap (`noindex`).
2. **Meta Conversions API** server-side for `booking_paid` and `contact_sent`. Only if the user gave marketing consent (stored on the booking or request). Hashed email; `event_id` shared with the pixel event for deduplication.
3. **Google Ads** conversion via the tag (after consent). Server-side is optional; skip if it adds a dependency.
4. **A simple report** in the coach area for the owner: bookings and revenue by `utm_source`/`utm_campaign` for a date range.

## Acceptance criteria
- [ ] A new landing page added by config only (shown in the PR).
- [ ] With Meta's test event code, a test booking shows one deduplicated `Purchase` event in Events Manager (screenshot).
- [ ] Without marketing consent, no server event is sent (API test with a mocked Meta endpoint).
- [ ] The owner report matches the database for a seeded set of bookings (test).
- [ ] Lighthouse mobile Performance ≥ 90 on each landing page.

## Out of scope
Running the ads. Lead magnets and newsletter (later).

## Needs from the user
Meta pixel ID + Conversions API token, and a Google Ads conversion ID, when ads start.
