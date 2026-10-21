# T02 Content EN/SL + catalog

**Goal:** all public texts in Slovenian and English, and the catalog of lab tests and packages as typed data that the site and the booking system read.

**Depends on:** T00. **Blocks:** T07 (seeds services from the catalog), T08 (texts).

**Owns:** `apps/web/messages/{en,sl}/{common,home,about,coaching,lab,packages,contact,footer}.json`, `packages/types/src/catalog.ts`, `docs/content/en.md`.

## Build
1. **English version** of `docs/content/jaka-marinko.md` in `docs/content/en.md`: natural English for athletes, not a word-for-word translation. Slovenian stays the source of truth for facts.
2. **Message files** for the public pages, in both languages: home, about (bio, results, Šmarna gora timeline), coaching (the 8 services), lab (tests, what each measures, how to prepare, what you get), packages (Plan, Coaching, Elite, personal training, race preparation), contact, footer, and common (nav, buttons, units).
   - Rewrite the old site's texts where they are thin. For example, the old lab page says nothing about what a test is or how to prepare. Use correct sports-science terms in both languages.
   - Facts only from `docs/content/` and `docs/product.md`. Invent no results, credentials, testimonials or locations.
3. **Catalog** (`packages/types/src/catalog.ts`), typed and with EN/SL names and descriptions:
   - **Lab tests:** id, duration in minutes (realistic estimate, marked `// estimate`), price in euro cents, preparation instructions, what's included. Prices from `docs/product.md`.
   - **Packages:** Plan, Coaching, Elite, with price, interval, credits per period (from `docs/product.md`), and features list. Features describe what the coach does; no mention of AI or automation anywhere.
   - **One-off items:** personal training session, 10-session pack, race preparation.
   - Unit tests: every item has both languages, every price is a positive integer, every credit rule references an existing test.
4. Leave Jaka's qualifications as a clearly marked placeholder (`TODO(qualifications)`). They come later from the user.

## Acceptance criteria
- [ ] `pnpm build` passes the EN/SL key-parity check from T00.
- [ ] Catalog unit tests pass; prices match the table in `docs/product.md` exactly.
- [ ] No text mentions Jaka Torkar, Strava API features, or anything not in `docs/content/` or `docs/product.md` (reviewer check).
- [ ] A test fails if any message file or the catalog contains the whole word `AI`/`A.I.`, or `artificial intelligence`, `umetna inteligenca` (any case form), `machine learning`, `strojno učenje`, `algorithm`/`algoritem` (case-insensitive). Normal words such as "email" or "automatically renews" must not trigger it.
- [ ] The PR lists every place where the English or Slovenian adds something the old site didn't say, for the user to approve.

## Out of scope
Page layout (T08), legal texts (T17).

## Needs from the user
Review of the Slovenian texts (tone), and Jaka's qualifications later.
