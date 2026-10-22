# T18 PRD: Premium polish, language switch and customer sign-in

**Status:** in progress (agents on `premium-site` and `customer-login`, combined on `premium-polish`)
**Depends on:** T01, T03, T08, T10, T11, T14, T15 (all merged). **Ships as:** one PR `premium-polish → development`, then one release PR to `main`.

## 1. Introduction

Release 3 is live, but the owner's verdict is that it doesn't look premium, looks off on mobile, has a weak language switch, and customers have no visible way to sign in. This task makes the public site, header, sign-in, account and booking flow look and feel like a premium endurance-sport brand, mobile first, with purposeful motion. Every quality bar is written as an automated assertion, so "done" is proven by tests, not by screenshots that look fine.

## 2. Goals

- A visitor on a phone (320–430 px) never sees horizontal scroll, cramped or edge-touching elements, tiny tap targets, or a cookie banner covering the hero.
- A customer can find "Sign in" in the header on every public page, and once signed in reach their account and bookings in one tap.
- Switching language is one compact, accessible control that keeps the page.
- Motion and depth make the site feel premium without slowing it down, and with nothing moving for visitors who ask for reduced motion.

## 3. User stories

Tags say how each criterion is proven:
- `[vitest]` is a component or logic test in `apps/web/src/**`.
- `[api]` is a Vitest test against the Hono app.
- `[e2e]` is Playwright in `apps/web/e2e/`.
- `[visual]` is a screenshot set reviewed against the checklist in §10.

Width set **W** = 320, 360, 375, 390, 414, 430, 768, 1024 and 1440 px.

Public page set **P**:
- `/{en,sl}` and `/{en,sl}/about`, `/coaching`, `/lab`, `/contact`;
- `/{en,sl}/booking`;
- `/{en,sl}/lp/<slug>` for every slug in `components/landing/pages.ts`;
- `/{en,sl}/legal/privacy`, `/terms`, `/cookies`;
- `/{en,sl}/sign-in`.

The two new spec files are:
- `apps/web/e2e/polish-site.spec.ts`, owned by **premium-site**;
- `apps/web/e2e/polish-header.spec.ts`, owned by **customer-login**.

### US-001: Compact language switch (customer-login)
**Description:** As a visitor, I want one small, clear language control, so that switching to Slovenian or English is obvious and keeps my place.

**Acceptance criteria:**
- [e2e] At 1440 px on `/en/coaching?package=elite`, the header contains exactly one language control with accessible name `Language` (SL: `Jezik`).
  - The words `English` and `Slovenščina` are not both visible as separate header links.
- [e2e] Activating the control and choosing Slovenian navigates to `/sl/coaching?package=elite` (same path, same query), and `<html lang>` becomes `sl`.
- [e2e] Keyboard only: Tab focuses the control, Enter (or Space) changes or opens it, and the language changes without a mouse. A visible focus ring is present: computed `outline-style` ≠ `none` or `box-shadow` ≠ `none`.
- [e2e] At 390 px, the same switch is inside the open mobile menu and works the same way.
- [e2e] The existing "the language switch keeps the page" test in `site.spec.ts` still passes, with only its selectors adapted.

**Verification:**
- **Tests:** `polish-header.spec.ts` "language".
- **Regression risk:** `site.spec.ts`, `consent.spec.ts`, and any spec that clicks `English`/`Slovenščina`.

### US-002: Header: premium, active page, scroll state (customer-login)
**Description:** As a visitor, I want a clean header that shows where I am and gets out of the way when I scroll.

**Acceptance criteria:**
- [e2e] On `/en/lab` at 1440 px, the nav link to `/en/lab` has `aria-current="page"`, and no other nav link does.
- [e2e] After `window.scrollTo(0, 200)`, the header element has `data-scrolled="true"` and a computed `backdrop-filter` containing `blur`. At scroll 0 it has `data-scrolled="false"`.
- [e2e] At 390 px, opening the menu:
  - shows an element with `role="dialog"` and `aria-modal="true"`;
  - sets `document.documentElement` or `body` computed `overflow` to `hidden` (scroll locked);
  - Tab cycles only through elements inside the dialog (checked across 15 Tabs);
  - Escape closes it and returns focus to the menu button.
- [e2e] The open mobile menu contains links `Book a test` → `/en/booking` and `Sign in` → `/en/sign-in`, and the language control.

**Verification:**
- **Tests:** `polish-header.spec.ts` "header".
- **Regression risk:** `app-shell.spec.ts` (the coach and account shells reuse the header).

### US-003: Customer sign-in entry and account menu (customer-login)
**Description:** As a customer, I want to sign in from any page and reach my account and bookings, so that I don't need to know a URL.

**Acceptance criteria:**
- [e2e] Signed out, at 1440 px on each page in **P**: the header shows a link named `Sign in` (SL `Prijava`) with `href` `/{locale}/sign-in`.
- [e2e] Signed in as a customer (magic link from the outbox, as in `auth.spec.ts`):
  - the header shows a button with the account's initials (`Ana Novak` → `AN`, or the first letter of the email when there's no name) and no `Sign in` link;
  - the button's menu has exactly `My account` → `/en/account`, `My bookings` → `/en/account/bookings` and `Sign out`, and no `Coach area`.
- [e2e] The same session after setting `role = head_coach` (as `app-shell.spec.ts` does): the menu also has `Coach area` → `/en/coach`.
- [e2e] `Sign out`:
  - the header shows `Sign in` again;
  - visiting `/en/account` then redirects to `/en/sign-in?next=%2Fen%2Faccount` (or the existing `next` format).
- [e2e] At 390 px, signed in, the open mobile menu shows the same account links.

**Verification:**
- **Tests:** `polish-header.spec.ts` "account menu".
- **Regression risk:** `auth.spec.ts`, `account.spec.ts`, `app-shell.spec.ts`.

### US-004: Sign-in page (customer-login)
**Description:** As a customer, I want a sign-in page that looks like the brand and tells me clearly what happens next.

**Acceptance criteria:**
- [e2e] At 1440 px, `/en/sign-in` shows the form and a brand panel side by side: their bounding boxes don't overlap, and both are wider than 400 px. At 390 px they stack, with the form first or within the first viewport height (form top < 844 px).
- [e2e] Submitting `bad@` shows an inline error under the field (`aria-invalid="true"` on the input), and no `POST /api/auth/sign-in/magic-link` request is sent.
- [e2e] Submitting `polish-<random>@example.com`:
  - shows a sent state containing that exact email;
  - shows a `Resend` button that is disabled and shows a countdown of at least 30 seconds;
  - one email to that address appears in the outbox.
- [e2e] After the countdown (fake the clock via `page.clock`), `Resend` is enabled, and clicking it puts a second email for that address in the outbox.
- [api] / [e2e] With `GOOGLE_CLIENT_ID` unset, the page has no `Continue with Google` button. [vitest] With Google enabled, the sign-in form renders a `Continue with Google` button above the email form.
- [e2e] At 390 px, the email input's computed `font-size` is ≥ 16 px.

**Verification:**
- **Tests:** `polish-header.spec.ts` "sign-in", and a Vitest test for the Google button.
- **Regression risk:** `auth.spec.ts` (magic-link round trip, `next` handling).

### US-005: Mobile layout quality on every page (premium-site for public pages; customer-login for header, sign-in, account, booking)
**Description:** As a visitor on a phone, I want every page to fit, read well and be easy to tap.

**Acceptance criteria:**
- [e2e] For every page in **P** at every width in **W**, in EN and SL: `document.documentElement.scrollWidth <= window.innerWidth` after load and after scrolling to the bottom.
- [e2e] For every page in **P** at 320, 375 and 390 px: every visible `a`, `button`, `input`, `select`, `textarea` and `[role=button]` has a bounding box at least 44×44 px. Excluded: links inside running text (`p a`, `li > p a`) and visually-hidden skip links until focused.
- [e2e] For every page in **P** at 390 px: every visible `input`, `select` and `textarea` has a computed `font-size` ≥ 16 px.
- [e2e] For every page in **P** at 390 and 1440 px, EN and SL: axe (`wcag2a`, `wcag2aa`, `wcag21aa`) reports zero violations, with the cookie banner open and with it dismissed.
- [e2e] For every page in **P** at 390 and 1440 px: zero `console.error` and zero `pageerror` events during load and a full scroll.
- [e2e] For every page in **P** at 390 px: no visible text element has computed `font-size` < 12 px.
- [e2e] For every page in **P** at 390 px with DPR 3: every visible `img` (except SVG) has `naturalWidth ≥ renderedWidth × 2`, so nothing is blurry on phones.

**Verification:**
- **Tests:**
  - the **premium-site** half of these loops goes in `polish-site.spec.ts`;
  - **customer-login** adds the same assertions for `/sign-in`, `/account/**` (signed in) and each booking step in `polish-header.spec.ts`.
- **Regression risk:** none functional; slower e2e. Keep the loops in one test per page and width group, with `test.slow()` where needed.

### US-006: Cookie banner on phones (customer-login)
**Description:** As a first-time visitor on a phone, I want to read the headline and tap "Book a test" before dealing with cookies.

**Acceptance criteria:**
- [e2e] First visit to `/en` at 390×844, banner open:
  - the banner's height is ≤ 40% of the viewport (≤ 338 px);
  - its bounding box doesn't intersect the hero `h1` or the primary `Book a test` link;
  - its bottom respects the safe area (it uses `env(safe-area-inset-bottom)` in its padding: `getComputedStyle` padding-bottom ≥ its 0-inset value).
- [e2e] `consent.spec.ts` passes unchanged in its assertions about stored consent and tags.

**Verification:**
- **Tests:** `polish-header.spec.ts` "cookie sheet".
- **Regression risk:** `consent.spec.ts`, and T14 conversions (consent cookie version).

### US-007: Premium public pages and motion (premium-site)
**Description:** As a visitor, I want the site to feel like a premium sports brand: real photography, depth, and motion that guides the eye.

**Acceptance criteria:**
- [e2e] On `/en` at 390 and 1440 px, with `reducedMotion: 'no-preference'`:
  - every section below the fold has a `data-reveal` attribute;
  - after `scrollIntoViewIfNeeded()` it reaches computed `opacity: 1` within 1000 ms;
  - before it scrolls into view, at least one such section has `opacity` < 1 or a non-`none` `transform`.
- [e2e] With `reducedMotion: 'reduce'`, on every page in **P**, right after load: every element with `data-reveal` has `opacity: 1` and `transform: none`, and no element has a running animation (`document.getAnimations().filter(a => a.playState === 'running').length === 0` after 500 ms).
- [e2e] Stats with a count-up (e.g. years, athletes, tests) end with exactly the number in the message file or catalog after being scrolled into view. With reduced motion they show the final number immediately.
- [e2e] Hovering (1440 px) the first pricing or lab-test card changes its computed `transform` or `box-shadow` within 300 ms. On touch (390 px, `hasTouch: true`), the card has an `:active` style or a visible focus style. No content is reachable by hover only.
- [e2e] On `/en`, the hero `h1` is visible (opacity 1, in the first viewport) within 1500 ms of `load` at 390 px, so motion never delays the main heading.
- [e2e] Headline balance: every `h1` and `h2` on pages in **P** has computed `text-wrap` of `balance` or `pretty`.
- [visual] Before/after screenshots of every page in **P** at 390 and 1440 px, EN and SL, plus a 10–20 s `recordVideo` of `/en` scrolling at 390 px and one at 1440 px, are pushed to `premium-site-screenshots` and linked in the PR.

**Verification:**
- **Tests:** `polish-site.spec.ts` "motion", "reduced motion", "stats", "cards", "hero".
- **Regression risk:** `smoke.spec.ts` and `site.spec.ts` (headings and CTAs), `landing.spec.ts`.

### US-008: Booking flow and account polish (customer-login)
**Description:** As a customer booking or checking my bookings, I want the same premium feel and to always know where I am.

**Acceptance criteria:**
- [e2e] On each booking step, a progress indicator exposes the current step: an element with `aria-current="step"` whose text is the step name. Its text (or `aria-label`) contains `Step 2 of 4` on the time step (SL `Korak 2 od 4`).
- [e2e] With `reducedMotion: 'reduce'`, moving between booking steps runs no animation (`getAnimations()` running count 0 after 300 ms).
- [e2e] `booking.spec.ts`, `payments.spec.ts` (when keys are set), `account.spec.ts` and `coach-booking.spec.ts` pass with only selector changes, and no assertion is removed or weakened.
- [e2e] Signed in at 390 px: `/en/account`, `/en/account/bookings`, `/en/account/profile` and `/en/account/privacy` meet every US-005 criterion.

**Verification:**
- **Tests:** `polish-header.spec.ts` "booking", "account".
- **Regression risk:** the booking flow (T11/T13), account (T15).

### US-009: Speed doesn't regress (both)
**Acceptance criteria:**
- [visual / measured] Lighthouse 12 mobile preset against the production build:
  - setup: 5 runs each of `development` @ 05aa8c5 and of the final branch, alternating;
  - for `/en` and `/en/lab`, the final medians are Performance ≥ the baseline median − 2, LCP ≤ the baseline median + 0.2 s, CLS ≤ 0.02, and TBT ≤ the baseline median + 100 ms.
  - The PR shows the table.
- [e2e] No new JS dependency over 15 kB gzipped is added to the public pages' client bundle (state the sizes of any added library in the PR).

## 4. Functional requirements

- **FR-1:** The header shows one language control (US-001) that keeps the path and query.
- **FR-2:** The header shows `Sign in` when signed out, and an account menu when signed in (US-003); staff also see `Coach area`.
- **FR-3:** The header has an active-page state and a scrolled state (translucent and blurred). The mobile menu is an accessible modal dialog (US-002).
- **FR-4:** The sign-in page has a split layout, a sent state with the email and a resend cooldown, and a Google button only when configured (US-004). Sign-in stays magic link + Google; no passwords.
- **FR-5:** On phones the cookie banner is a compact bottom sheet that doesn't cover the hero (US-006); consent logic is unchanged.
- **FR-6:** Public pages get premium visuals and scroll-reveal motion, built from shared components in `components/ui/` and documented in `docs/design.md` (US-007).
- **FR-7:** All motion is disabled under `prefers-reduced-motion: reduce`.
- **FR-8:** The booking flow has a step progress indicator and animated step changes (US-008).
- **FR-9:** No page overflows horizontally, and tap targets, inputs and text meet the US-005 minimums at every width in W.

## 5. Non-goals

- No password sign-in, no new auth providers, and no change to session or role logic.
- No new pages or content sections beyond restyling. Copy may be shortened, never extended with new claims.
- No change to booking, payment, consent or conversion behaviour (layout and styling only).
- No dark mode.
- No changes to the coach area beyond what the shared components bring.

## 6. Design considerations

- **Prototype artifact:** none. The owner is offline overnight and asked for the work to run unattended, so the variant pick is skipped. Quality is enforced by the assertions above and by the art-director screenshot review in §10.
- **Visual direction:** premium endurance-sport brand (the level of Whoop, Polar or a top cycling brand), on Jaka's brand: logo, colours and fonts in `apps/web/src/styles/theme.css`, and the race-bib motif.
- **Reuse:** `components/ui/*`, `docs/design.md` (from #34), `components/site/*`, `components/landing/*`.
- **Never copy** the old Lovable site.
- The current live state is in `scratchpad/live/` (session scratchpad) and the mobile audit's `findings.md`.

## 7. Technical considerations

- **Motion:** CSS first (transitions, keyframes, `animation-timeline: view()` with an IntersectionObserver fallback), with no heavy animation library in the public bundle.
- **Safe areas:** `env(safe-area-inset-*)` on sticky and fixed elements, plus `viewport-fit=cover` if needed.
- **Headlines:** `text-wrap: balance` on `h1` and `h2`.
- **Session:** the header's signed-in state is read server-side (`lib/session`), so there's no flash of the wrong state; staff role from the session user.
- **Sharing work between the agents:**
  - **premium-site** owns `components/ui/*`, `theme.css`/`globals.css`, the public page bodies, landing and footer;
  - **customer-login** owns the header, `(auth)`, `(app)/account`, booking, and the cookie banner layout.

## 8. Success metrics

- The owner's mobile walkthrough finds nothing that "looks off".
- A customer reaches "My bookings" from any page in at most 2 taps.
- Mobile Lighthouse doesn't drop (US-009).

## 9. Open questions

- The owner never picked a visual variant (skipped while unattended); they review screenshots in the PR.
- If a premium treatment needs new photography (more action shots of Jaka or the lab), list the shots wanted in the PR. Don't use stock images.

## 10. Verification checklist

### Per-change coverage

**Language switch (US-001)**
- [ ] Frontend: one control, accessible name `Language`/`Jezik`, in the header at 1440 px and in the menu at 390 px
- [ ] Behaviour: path and query kept, `html lang` updated
- [ ] Keyboard and focus ring
- [ ] Round-trip: EN → SL → EN returns to the same URL
- [ ] Edge: switching on `/en/booking?service=vo2max` mid-flow keeps `service`

**Header and account menu (US-002, US-003)**
- [ ] `aria-current` on the active link; `data-scrolled` and blur after scrolling
- [ ] Signed out: `Sign in` on every page in P
- [ ] Customer: initials, 3 menu items exactly; head_coach: + `Coach area`
- [ ] Sign out round-trip: header back to `Sign in`, `/en/account` redirects
- [ ] Mobile menu: dialog, scroll lock, focus trap, Escape returns focus

**Sign-in (US-004)**
- [ ] Split at 1440 px, stacked at 390 px
- [ ] Invalid email: inline error, no request
- [ ] Sent state with the email; resend disabled ≥ 30 s, then a second email in the outbox
- [ ] Google button only when configured
- [ ] Input font ≥ 16 px

**Mobile quality (US-005, US-006)**
- [ ] No overflow: every page in P × every width in W × EN/SL
- [ ] Tap targets ≥ 44 px at 320/375/390
- [ ] axe zero at 390/1440 × EN/SL, banner open and dismissed
- [ ] No console errors, no text < 12 px, no blurry images
- [ ] Cookie sheet ≤ 40% of the viewport and clear of the hero `h1` and CTA

**Motion (US-007, US-008)**
- [ ] `data-reveal` sections animate in; nothing animated under reduced motion
- [ ] Count-ups end on the exact values; immediate under reduced motion
- [ ] Hero `h1` visible within 1.5 s at 390 px
- [ ] Booking progress `Step n of 4`; no step animation under reduced motion

### Test data setup

- **Signed-in customer:** request a magic link for `polish-<random>@example.com` with the name `Ana Novak` set through the profile page (or `update users set name = 'Ana Novak'`), then sign in via the outbox link (helper as in `auth.spec.ts`).
- **Staff:** the same user after `update users set role = 'head_coach'`, as in `app-shell.spec.ts`. Reset to `customer` afterwards.
- **Account pages with content:** one confirmed future booking and one past `completed` booking for that user (insert via `pg`, as `account.spec.ts` does), so the overview, bookings and the empty-vs-populated layout are both exercised. Plus a second user with no bookings, for the empty states.
- **Long-content edge cases:**
  - an account name of 40 characters (`Ana-Marija Novak Kranjc Vidmar Potočnik`);
  - an email of 60 characters;
  - every check at 320 px in SL (the longest strings).
- **Cleanup:** e2e data lives in the worktree's own database `jm_<branch>`; nothing to remove.

### Browser end-to-end

- [ ] Every `[e2e]` criterion above is in `polish-site.spec.ts` or `polish-header.spec.ts` and passes.
- [ ] Happy path at 390 px: `/sl` → menu → `Prijava` → magic link → account menu → `Moje rezervacije` → `Rezerviraj test` → booking step 2 shows `Korak 2 od 4`. Zero console errors.
- [ ] Visual set (US-007) pushed and linked. The art-director checklist is walked for each page at 390 px and the results are reported as **pass or fixed** per item:
  - alignment to one grid;
  - consistent gutters (16 or 20 px at ≤ 430 px);
  - vertical rhythm;
  - headline breaks;
  - nothing touching the edges;
  - photo crops;
  - button sizes consistent;
  - sticky elements not overlapping content.
- [ ] The mobile audit (`scratchpad/mobile-audit/findings.md`) is re-run on the combined branch, with zero open P1/P2 findings.

### Suite gates

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes, and also once on 2 cores (`taskset -c 0,1 pnpm test --force`), as CI runs it
- [ ] `pnpm build` passes (includes the api bundle `node --check`)
- [ ] `pnpm e2e` passes, including both new spec files
- [ ] The evidence reported in the PR is test output, the Lighthouse table and screenshot links, not "looks good"
