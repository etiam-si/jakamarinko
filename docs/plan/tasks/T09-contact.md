# T09 Contact form + requests inbox

**Goal:** the contact form sends to the database and to the coach's email; the coach has an inbox with statuses.

**Depends on:** T03, T06, T08 (contact page), T10 (coach area).

**Owns:** `packages/db/src/schema/requests.ts`, `packages/api/src/requests.ts`, `apps/api/src/routes/requests.ts`, `apps/web/src/components/contact/`, `apps/web/src/app/[locale]/(app)/coach/requests/`, `apps/web/messages/{en,sl}/requests.json`. It may add the form component to T08's contact page (one import + one element).

## Build
1. **Form:** name, email, phone (optional), topic (coaching, lab test, other), message. Plus a consent checkbox for being contacted, with a link to privacy.
   - Spam protection: a honeypot field plus a rate limit per IP (`CF-Connecting-IP`), 5 per hour.
   - Success state; `track("contact_sent")`.
2. **API** `POST /api/requests`, validated with Zod. Stores the request, then emails the head coach (T06 template) and sends an auto-reply in the sender's language.
3. **Inbox** `/coach/requests`: a list with status `new | answered | done`, filters, a detail view, a reply-by-email link (`mailto:` with the subject prefilled), and the status change.

## Acceptance criteria
- [ ] Playwright: submit in SL → the request is in the inbox, an email to the coach and an auto-reply in SL are in `.emails/`.
- [ ] The 6th submission from the same IP within an hour → 429 with a friendly message.
- [ ] A filled honeypot → 200 to the client, but nothing is stored or sent.
- [ ] A customer can't call the inbox API (403).

## Out of scope
Two-way messaging in the app.

## Needs from the user
Nothing.
