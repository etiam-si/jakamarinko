# T08 Public site

**Goal:** the new jakamarinko.com in EN and SL, replacing the Lovable site. Fast, credible, and every page leads to booking a test or choosing a package.

**Depends on:** T01 (brand), T02 (texts, catalog). **Blocks:** T09, T11, T14.

**Owns:** `apps/web/src/app/[locale]/(site)/` except `booking/`, `lp/`, `legal/`, `styleguide/`; `apps/web/src/components/site/`; `apps/web/src/app/sitemap.ts`, `robots.ts`, OG image routes.

## Build
1. **Layout:** header with logo, nav, language switch and a "Book a test" button; footer with contact, Instagram, Strava **profile link** (just a link), legal links and cookie settings. Mobile first.
2. **Pages:**
   - **Home:** promise, proof (results, VO₂max 80, Red Bull 400), how it works (test → zones → plan → progress), offers, call to action.
   - **About:** bio and the Šmarna gora timeline as a chart (Recharts).
   - **Coaching:** the 8 services, the three packages with prices, FAQ.
   - **Lab tests:** each test, what it measures, preparation, price, and the Performance package. Each has a "Book" button to `/booking?service=…`, which T11 builds.
   - **Contact:** phone, email, Instagram, and a slot for the form (T09).
3. Content only from T02's message files and catalog. Photos from `docs/content/photos/` (copied into `public/` and optimised with `next/image`), following T01's photo rules.
4. **SEO:**
   - Metadata per page and language, `hreflang` alternates, canonical URLs.
   - `sitemap.xml` and `robots.txt`; per-page Open Graph images from T01's base.
   - JSON-LD for `Person` and `LocalBusiness`/`SportsActivityLocation` (no address until the user says so).
5. Static rendering wherever possible.

## Acceptance criteria
- [ ] Lighthouse mobile on home, coaching and lab, in both languages: Performance ≥ 90, Accessibility ≥ 95, SEO 100, Best Practices ≥ 95.
- [ ] Playwright: every nav link works in both languages; the language switch keeps the page; every "Book" button goes to `/booking` with the right `service`.
- [ ] No hard-coded user-facing string (lint rule or test that scans `(site)` for JSX text).
- [ ] `sitemap.xml` lists every page in both languages with `hreflang`.
- [ ] Screenshots of each page at 375 px and 1440 px in the PR.

## Out of scope
Booking flow (T11), contact form (T09), ad landing pages (T14), legal pages (T17).

## Needs from the user
Full-resolution photos when available (the site must look good with the small ones until then).
