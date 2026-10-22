# @jakamarinko/auth

Better Auth, mounted by the api at `/api/auth/*` ([T03](../../docs/plan/tasks/T03-auth.md)).
- Sign-in: Google (when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set) and an email magic link, sent through `@jakamarinko/email`. Sessions live in Postgres; the bearer plugin accepts `Authorization: Bearer <session token>` for the Expo app.
- A new user's `locale` is the language they signed in from; `role` starts as `customer`.
- `consents.ts`: grant and withdraw `health_data` / `marketing`. Withdrawing sets `withdrawn_at` and never deletes the row.
- `seed()`: owner, head coach and the default location from env. The api runs it on every start.

Guards: `requireSession` / `requireRole(...)` in `apps/api/src/lib/auth.ts`, and `getSession()` / `requireRole()` in `apps/web/src/lib/session.ts`. Roles: owner ⊇ head_coach ⊇ coach; customers and athletes only match themselves. Every guarded route also needs `health_data` consent.

Tests use PGlite (in-memory Postgres with the real migrations), so `pnpm test` needs no database.
