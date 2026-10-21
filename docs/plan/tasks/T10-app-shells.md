# T10 App shells

**Goal:** the signed-in areas exist with navigation and role guards, so feature tasks only add pages.

**Depends on:** T01, T03. **Blocks:** T09, T12, T15.

**Owns:** `apps/web/src/app/[locale]/(app)/layout.tsx`, `(app)/coach/layout.tsx` + `page.tsx`, `(app)/account/layout.tsx` + `page.tsx`, `apps/web/src/components/app-shell/`, `apps/web/messages/{en,sl}/app.json`, `apps/web/src/lib/nav.ts`.

## Build
1. **Coach area** `/[locale]/coach`:
   - Sidebar on desktop and a sheet on mobile, with entries from `lib/nav.ts`: Today, Bookings, Requests, Athletes (disabled "coming soon"), Settings.
   - Guard: `coach` or above. Head coach and owner see a coach switcher (whose calendar), only when more than one coach exists.
2. **Customer account** `/[locale]/account`: My bookings, Profile, Privacy. Guard: any signed-in user with the health-data consent.
3. **Nav registry:** a feature task adds its page by adding one entry in `lib/nav.ts`. Add that file to the hot-file list in `docs/plan/README.md`.
4. Empty states with real copy for every entry, so the shell looks finished.
5. The user menu has language, sign out, and the switch between coach and customer views if the user is both.

## Acceptance criteria
- [ ] Playwright: a customer is sent away from `/coach` (403 page); a coach reaches both areas; signed out → `/sign-in` with a return URL.
- [ ] Every shell page renders in both languages at 375 px and 1440 px (screenshots in the PR).
- [ ] Adding a nav entry is a one-line change (shown in the PR description).

## Out of scope
The features themselves (T12, T15, T09).

## Needs from the user
Nothing.
