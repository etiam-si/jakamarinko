# T05 Cookie consent, analytics, UTM, `track()`

**Goal:** GDPR-correct consent, one `track()` call for every conversion event, and the ad source remembered until the customer books.

**Depends on:** T00. **Blocks:** T11, T14.

**Owns:** `apps/web/src/components/consent/`, `apps/web/src/lib/{track,utm,consent}.ts`, `apps/web/messages/{en,sl}/consent.json`, `apps/api/src/routes/events.ts`, `packages/api/src/events.ts`.

## Build
1. **Consent banner + settings dialog**, bilingual, own component (no third-party CMP):
   - Categories: necessary (always on), analytics, marketing.
   - "Reject all" is as easy as "accept all".
   - The choice is stored in a first-party cookie with a version. A footer link reopens the settings.
2. **Analytics:** cookieless, privacy-friendly analytics script (Umami), loaded only if `NEXT_PUBLIC_UMAMI_URL` is set. It's allowed before consent only because it's cookieless; say so in a code comment with the reason.
3. **Marketing tags:** Meta pixel and Google tag, loaded **only after marketing consent**, and only if their env IDs are set.
4. **UTM capture:** on landing, read `utm_*`, `fbclid` and `gclid` and keep them in a first-party cookie for 30 days (last-touch). `getAttribution()` returns them; T11 stores them on the booking.
5. **`track(event, props)`:** one function used by all features. It sends to Umami, plus Meta/Google if consented. Events (typed union in `packages/api/src/events.ts`): `booking_started`, `booking_paid`, `package_started`, `contact_sent`, `lead_signup`. Server-side events (Meta Conversions API) are T14.

## Acceptance criteria
- [ ] Playwright: on first visit no marketing script is requested (checked by network log). After "accept all" they are. After "reject all" they never are, including on the next page.
- [ ] Playwright: landing with `?utm_source=instagram&utm_campaign=x`, then navigating 3 pages, `getAttribution()` still returns them.
- [ ] With no env IDs set, nothing loads and nothing errors.
- [ ] Unit tests for the consent cookie parsing and versioning (an old version shows the banner again).

## Out of scope
Server-side conversion events (T14), deploying Umami on the server (main session, see "Needs from the user").

## Needs from the user
Meta pixel ID and Google tag ID when ads start. Umami gets deployed on t4a by the main session (`analytics.jakamarinko.com`), not by this task.
