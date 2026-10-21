# jakamarinko.com: product proposal

> **Status: draft for review (2026-10-21).** This is what I (Claude) think the app should be, inferred from the old site and the planned stack. Nothing here is decided until someone confirms it. Points marked **❓** are open questions. Content and prices: [content/jaka-marinko.md](content/jaka-marinko.md).

## In one paragraph
jakamarinko.com is Jaka Marinko's endurance coaching business moved online. Today it is a brochure where every button ends at "call or email me". The new app replaces that with: a fast public site that sells coaching and lab tests, online requests and bookings, and a private area where Jaka's athletes log in, connect Strava, and see their training plan, lab results and training zones. Jaka gets one dashboard with all his athletes' data. Later it adds paid subscriptions and a native mobile app for athletes.

## Who uses it
| Role | Who | What they need |
|---|---|---|
| **Visitor** | A runner, skier or cyclist looking for a coach or a lab test | To understand the offer and prices, trust Jaka (results, VO₂max 80), and send a request or book a test in under a minute. |
| **Athlete** | Someone Jaka coaches | To see this week's plan, their training zones and lab results, and have their Strava workouts show up on their own. |
| **Coach (admin)** | Jaka | To see all athletes in one place, plan their weeks, enter lab results, and get requests without chasing emails. |

Only one coach exists at the start. **❓** Will other coaches ever sign up (a real multi-coach SaaS), or is this Jaka's own business platform? The data model below keeps a `coach_id` so either works, but the product and pricing are very different.

## Language
Slovenian first (all existing content is Slovenian). **❓** English later? If yes, set up i18n from day one; adding it later means touching every page.

## Phases

### Phase 1: public site + requests (replaces the Lovable site)
- Pages: Domov, O meni, Trenerstvo, Laboratorijske meritve (price list), Kontakt. Content from `docs/content/`, new design. Never copy the old Lovable design.
- **Contact form** that stores the message in Postgres and emails Jaka. Today it is a dead form.
- **Lab test request**: pick a test or the Performance paket, preferred dates, and contact details. Jaka confirms by email. This is not a real calendar yet. **❓** Where are the tests done, who runs them, and how are slots decided?
- Admin view of incoming requests (contact + lab) with status: new / answered / done.
- SEO basics: metadata, sitemap, Open Graph images, fast static pages.
- **Done when:** jakamarinko.com fully replaces the Lovable site and every request lands in the database and in Jaka's inbox.

### Phase 2: athlete accounts + Strava
- Sign-in with Better Auth: Google OAuth plus email (magic link or password).
- Athletes join **by invite from Jaka** (no open sign-up), so only coached athletes get in.
- **Connect Strava** (OAuth). Activities sync through Strava webhooks plus a backfill of the last N weeks.
- Athlete dashboard: recent activities, weekly volume and time per sport, and simple load trends (Recharts).
- Coach dashboard: athlete list showing each athlete's last activity, week volume and flags such as no training for 7 days.
- **Done when:** an invited athlete signs in with Google, connects Strava, and both they and Jaka see their workouts appear without anyone doing anything.

### Phase 3: coaching tools
- **Lab results per athlete**: Jaka enters a test (date, type, VO₂max, lactate thresholds LT1/LT2, HR and pace or power at thresholds, fat/carb data, anthropometry). Training zones are computed from it and shown to the athlete. Zone history shows progress over time.
- **Training plan**: Jaka plans workouts per day (sport, duration or distance, intensity zone, description). The athlete sees the week. Each done Strava activity is matched to the planned workout (planned vs done).
- **Comments** on a workout or week between Jaka and the athlete. These replace the "stalna komunikacija" that today happens over WhatsApp/phone.
- **Done when:** Jaka can run online coaching for one athlete fully inside the app.

### Phase 4 (later): payments
- Stripe Checkout + Billing for monthly online coaching, and Customer Portal for cancel / change card.
- Paying for a lab test online when booking. **❓** Is this wanted, or is paying on the spot fine?
- RevenueCat only once the mobile app sells subscriptions in-app.
- **❓** Coaching prices and packages are not on the old site.

### Phase 5 (later): mobile app (Expo)
- For athletes: today's workout, the week, zones, lab results, comments, push notifications ("new plan for next week").
- Uses the same Hono API and Better Auth sessions as the web app. Nothing on the server changes.

## Data model sketch
```
users            id, name, email, role (athlete | coach | admin), image
coaches          id, user_id                        -- one row (Jaka) at first
athletes         id, user_id, coach_id, sports[], birth_year, notes
strava_accounts  athlete_id, strava_athlete_id, tokens, scopes, connected_at
activities       id, athlete_id, strava_id, sport, start, duration, distance, elevation, avg_hr, avg_power, raw jsonb
lab_tests        id, athlete_id, date, type, results jsonb, zones jsonb, notes
planned_workouts id, athlete_id, date, sport, target (duration/distance), zone, description, activity_id (matched)
comments         id, author_id, athlete_id, planned_workout_id?, body, created_at
requests         id, kind (contact | lab_test), name, email, phone, message, test_type, preferred_dates, status
```
Better Auth owns its own tables (sessions, accounts). Stripe tables come in phase 4.

## Strava: what to know before building
- **New Strava API apps start with a limit of 1 connected athlete.** Ask Strava to raise it early, because their review takes time. Plan for this before phase 2.
- Rate limits (default: 200 requests per 15 minutes, 2,000 per day per app). Use webhooks, not polling.
- **❓ Check Strava's current API agreement on showing an athlete's data to someone else** (here: the coach). Their 2024 terms update restricted this, and coaching platforms are a special case. Verify before building the coach view on Strava data.
- Garmin's own API needs an approved business application. Start with Strava (most Garmin users sync to Strava anyway) and add Garmin only if athletes need data Strava lacks (e.g. HRV, sleep).

## Tech (from the agreed stack)
- Web: Next.js 16, Tailwind, shadcn/ui, TanStack Query, Zod, Recharts.
- API: Hono + Drizzle + Postgres (already deployed on t4a at `/api`), Better Auth.
- Shared packages: `db` (Drizzle schema + client), `auth` (Better Auth config), `api` (Hono routes + Zod contracts, typed client for web and mobile), `types`.
- **Repo change first:** move from npm workspaces to **pnpm + Turborepo** and split `packages/shared` into those packages. Do this before phase 1 code, while the repo is still tiny.
- Tests: Vitest for API and logic, Playwright for the main flows (request a lab test, sign in, connect Strava).
- Deploy: unchanged. Push to `main` → GitHub Actions → GHCR → t4a (`infra/README.md`).

## Not in v1
- Multi-coach sign-up, coach marketplace
- Garmin / Polar / Coros direct integrations
- A full calendar booking system (a request + confirm flow first)
- Workout builder exported to devices (e.g. structured workouts to Garmin)
- Chat in real time (comments are enough)
- English, unless decided otherwise

## Open questions (to answer before phase 1 starts)
1. Only Jaka's athletes, or other coaches too?
2. Lab tests: where, who runs them, how are slots decided, and pay online or on the spot?
3. Coaching packages and prices?
4. Slovenian only, or English too?
5. Does Jaka have full-resolution photos and a logo?
6. Should the request emails go to `jaka.marinko06@gmail.com`, or to a new address on jakamarinko.com? The latter needs email set up for the domain.
