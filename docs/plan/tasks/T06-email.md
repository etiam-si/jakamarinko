# T06 Email

**Goal:** branded, bilingual transactional emails, sent through a transport chosen by env. In dev they never reach real people.

**Depends on:** T00 (the `packages/email` interface). **Blocks:** T07, T09 (and T03 uses it once merged).

**Owns:** `packages/email/`.

## Build
1. **Templates** with React Email, in EN and SL, from one layout (logo, footer with contact, unsubscribe link only for marketing). Start with:
   - magic link
   - booking confirmation (with location and a calendar `.ics` attachment)
   - booking preparation instructions
   - booking reminder (24 h)
   - booking cancelled
   - contact form received (to the coach)
   - contact form auto-reply (to the sender)
   Each takes typed props; texts come from a message file inside the package.
2. **Transports** chosen by `EMAIL_TRANSPORT`:
   - `console`: the default, as in T00.
   - `smtp`: generic SMTP via env, so any provider works.
3. `sendEmail` takes the template name, locale and props; picks the subject and body in the right language; and returns a message ID or an error. It never throws on a send failure, and it logs a warning without the recipient's health data.
4. A preview script (`pnpm --filter email preview`) renders every template in both languages to `.emails/preview/`.

## Acceptance criteria
- [ ] Unit tests: every template renders in both languages with sample props, and no `undefined` or missing-key text appears in the output.
- [ ] The `.ics` attachment opens in Google Calendar and Apple Calendar with the right time zone (Europe/Ljubljana).
- [ ] With `EMAIL_TRANSPORT=smtp` against a local test SMTP server (e.g. Mailpit in `dev/compose.yml`), an email arrives with the right subject in each language.
- [ ] The PR has screenshots of every template in both languages, light mode.

## Out of scope
Newsletters and marketing emails. Choosing the provider.

## Needs from the user
The sender address and SMTP credentials, once the email decision is made. Until then production uses `console` and logs a warning at start.
