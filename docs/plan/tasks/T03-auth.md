# T03 Auth, users, roles, consents

**Goal:** people can sign in with Google or an email magic link. Every user has a role and a language, and every consent is recorded.

**Depends on:** T00. **Blocks:** T07, T09, T10, T15.

**Owns:** `packages/auth/`, `packages/db/src/schema/{auth,users}.ts`, `packages/api/src/auth.ts`, `apps/api/src/routes/auth.ts`, `apps/web/src/app/[locale]/(auth)/`, `apps/web/src/lib/session.ts`, `apps/web/messages/{en,sl}/auth.json`.

## Build
1. **Better Auth** in `packages/auth`, mounted in the api under `/api/auth/*`, sessions in Postgres (Drizzle adapter).
   - Providers: Google OAuth and email magic link. The magic link goes out through `packages/email`, whose console transport is enough here.
   - Cookies are for `jakamarinko.com` only. Sessions must also work for the future Expo app: enable the bearer/token plugin, but don't build the mobile side.
2. **Tables:**
   - `users` extra fields: `locale`, `role` (`customer | athlete | coach | head_coach | owner`).
   - `coaches` (`user_id`, `active`), `locations` (`name`, `address`, `is_default`).
   - `consents` (`user_id`, `kind`: `health_data | ai_processing | marketing`, `granted_at`, `withdrawn_at`, `version`).
   - Seed: one owner (email from env `OWNER_EMAIL`), Jaka as `head_coach` (env `HEAD_COACH_EMAIL`), the default location "Jaka's home" (address from env, never committed).
3. **Role helpers:**
   - API middleware `requireRole(...)`.
   - Web server helper `getSession()` + `requireRole()` for route groups.
   - Rules: `owner` ⊇ `head_coach` ⊇ `coach`. Customers and athletes see only their own data.
4. **Sign-in page** (`/[locale]/sign-in`) in both languages: Google button and email field, a "check your email" state, errors. After the first sign-in, ask for consent to health data processing, required to use the account, and optionally marketing. Store each one in `consents`.
5. A new user's `locale` is the language they signed in from.

## Acceptance criteria
- [ ] Playwright: magic-link sign-in end to end, with the link read from `.emails/`. Then sign out.
- [ ] Google sign-in works with real test credentials on localhost. The PR says how it was checked.
- [ ] API tests: `requireRole("coach")` returns 401 without a session, 403 for a customer, and 200 for coach, head_coach and owner.
- [ ] A user without `health_data` consent is sent to the consent step and can't reach `/account` or `/coach`.
- [ ] Withdrawing a consent sets `withdrawn_at`; it never deletes the row.
- [ ] The seed runs twice without creating duplicates.

## Out of scope
Account settings UI (T15), coach management UI (later).

## Needs from the user
A Google OAuth client (client ID and secret) with redirect URIs for `https://jakamarinko.com` and `http://localhost:*`, plus `OWNER_EMAIL`, `HEAD_COACH_EMAIL`, and the lab address for the server `.env`.
