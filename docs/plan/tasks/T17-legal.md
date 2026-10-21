# T17 Legal pages

**Goal:** draft privacy policy, terms and cookie policy in EN and SL that match what the app actually does. **They are drafts for a lawyer or the user to review**, and every page says "draft" until approved.

**Depends on:** T00. **Blocks:** launch (not other tasks).

**Owns:** `apps/web/src/app/[locale]/(site)/legal/`, `apps/web/messages/{en,sl}/legal.json`, `docs/legal/processors.md`.

## Build
1. **Privacy policy:**
   - Controller: Grega's company. Leave placeholders for name, address and registration number.
   - What data and why: account, bookings, payments, and health data under GDPR art. 9 (HR, lab results, check-ins).
   - Legal bases, consents, how to withdraw them.
   - **The AI statement:** what AI does with the data and that a coach reviews it.
   - Retention, rights (access, export, deletion), processors, data location (EU, Germany), and contact.
2. **Processors list** (`docs/legal/processors.md`): hosting (Hetzner), backups (Hetzner Storage Box), email provider (TBD), Stripe, AI provider, analytics (Umami, self-hosted), Meta/Google (only with consent).
3. **Terms:** booking and cancellation rules (free up to 24 h before; later no-show policy), subscriptions (minimum 3 months for Coaching/Elite, how to cancel), lab tests are at the customer's own risk with a health questionnaire, AI plans are not medical advice.
4. **Cookie policy:** matches the categories in T05 exactly.
5. Footer links come from T08. This task only provides the pages.

## Acceptance criteria
- [ ] Every processor and cookie in the app appears in the policies, and nothing that doesn't exist does (the reviewer cross-checks against T05 and `.env.example`).
- [ ] Both languages say the same thing (the reviewer compares section by section).
- [ ] Every page shows a visible "Draft, not yet in force" banner until a flag `LEGAL_APPROVED=true` is set.

## Out of scope
Legal review itself.

## Needs from the user
Company details, and review by the user or a lawyer before launch.
