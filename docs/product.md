# jakamarinko.com: product plan

> **Status: draft v4 (2026-10-21).** Agreed in conversation, not yet validated with real customers. Points marked **❓** are open. Content and lab prices: [content/jaka-marinko.md](content/jaka-marinko.md). Never copy the old Lovable design. Jaka Torkar is not part of the project.

## Decisions (2026-10-21)
| Topic | Decision |
|---|---|
| Business | Owned by Grega (the product owner) through his existing company, which is also the legal entity for Stripe and any device APIs. |
| Jaka | Full time on coaching and lab tests. His qualifications are added to the site later. |
| Coaches | Jaka may employ more coaches: one business, several coaches, Jaka as head coach. Not a marketplace for outside coaches. |
| Lab location | At Jaka's home by default; can be a different place per booking. |
| Garmin | Not planned for now. Training data comes from file upload; device connections stay on the later list. |
| AI provider | claude-pool, also in production. Code calls one internal interface, so the provider can be swapped. |
| AI | Runs everything automatically and fast, with **no approval step**. Customers never see the word AI (site, app, emails, ads, package names). Safety comes from automatic rule checks and red-flag stops, not from approvals. Messages from athletes are answered by a person. |
| Customer overview | Every customer has one overview page with all their data and the live status of anything being prepared. |
| Languages | English and Slovenian from day one (see "Languages"). |
| Brand | Logo, colours and type designed as part of phase 1 (no existing logo). |
| Marketing | Jaka's Instagram and Strava profile, plus paid ads (Meta/Instagram first, Google later). |
| Coaching method | Claude writes it (`docs/coaching-method.md`); Jaka reviews. |
| Email sender | **❓** Grega decides. |
| Prices | The prices in this doc are the launch prices. They live in the database and can change without code. |

## In one paragraph
Jaka Marinko's endurance coaching and lab testing, run as one app. The thing that can't be copied is Jaka himself (national-team background, VO₂max 80) plus real lab data (lactate, VO₂max). AI is the lever that lets one coach serve many athletes: it writes plans, analyses training and writes reports automatically within Jaka's method, and Jaka spends his time on lab tests, calls and the athletes who need him. We do **not** compete as a generic AI training app (Runna, TrainerRoad, Humango and Garmin Coach already own that); we sell Jaka + lab + data, with AI underneath.

```
Lab test ──> zones ──> plan (automatic, rule-checked) ──> athlete trains ──> workout file / sync
   ▲                                                                                  │
   └──── "time for a retest" <──── weekly analysis (automatic) <──── planned vs done ◄┘
```

## Who uses it
| Role | Who | Needs |
|---|---|---|
| **Visitor** | Endurance athlete looking for a coach or a test | Understand the offer and prices, trust Jaka, book a test or start a package in a minute. |
| **Test-only customer** | Wants their numbers, not a coach | Book and pay for a test, get results, zones and a report in their account. |
| **Athlete** | Subscriber | This week's plan, zones, lab history, feedback on how training went. |
| **Coach** | An employed coach (later) | Their own athletes (overview + what the engine sent), red-flag alerts, enter lab results, answer messages, their own bookings. |
| **Head coach** | Jaka | Everything a coach does, plus all athletes, assigning athletes to coaches, the coaching method and its rules, spot checks across all coaches. |
| **Owner** | Grega | Prices and packages, payouts, coaches, reports, settings. |

One business, several coaches. Every athlete belongs to one coach. Every booking belongs to one coach and one location. Jaka is the only coach at launch.

## Offer
Prices below are the launch prices (decided 2026-10-21). The pricing guide stays for later changes.

### Monthly packages
| | **Plan** | **Coaching** ⭐ | **Elite** |
|---|---|---|---|
| For | Wants structure for little money; often after a test | Has a goal and wants Jaka | Competitors |
| Training plan | plan built on Jaka's method, adapts every week | same, plus Jaka's personal comments on your weeks | same, adjusted day by day, plus Jaka's direct involvement |
| Analysis | every workout + weekly summary, within minutes | same | same |
| Lab tests | −20 % | lactate test every 3 months included | lactate every 2 months + Performance package 2×/year |
| Contact | messages in the app, answered within 72 h | reply within 48 h + monthly call | reply within 24 h + call every two weeks + 2 in-person sessions/month |
| Rough price | ~25 €/mo | ~119 €/mo | ~229 €/mo |

Package names, descriptions and every text customers read describe what the customer gets, never the tools behind it, and never promise personal work that isn't part of the package.

Minimum 3 months on Coaching and Elite. Paying a year up front: 2 months free.

### One-off
- **Lab tests** at the existing prices (VO₂max 90 €, lactate 90 €, both 150 €, fat/carb use 130 €, running economy 80 €, anthropometry 50 €, Performance package 250 €). Every test ends with an offer: 30 days of Plan free, or the first month of Coaching at −50 %.
- **Personal training**: one session (e.g. 45 €), or a pack of 10 at a discount.
- **Race preparation**: a 12–16-week block for one race, with a test at the start and end, paid once.

### Credits
Packages give credits on a schedule (e.g. Coaching: 1 lactate test every 3 months; Elite: 2 in-person sessions a month). A credit is spent by booking. Coaches see unused and overdue credits, and the app reminds the athlete. Stripe handles billing; credits are our own simple ledger.

### Pricing guide
Prices come from three things: Jaka's time, what the market pays, and what is left after costs.

**1. Time per customer per month** (plans and analyses are automatic; estimate, measure with the first athletes):
| | Jaka's hours / athlete / month |
|---|---|
| Plan | ~0.1 (red flags and messages only) |
| Coaching | ~1.5 (personal comments, messages, one call, tests spread over the quarter) |
| Elite | ~6 (plus 2 in-person sessions, calls, more tests) |

**2. Capacity.** Full time is about 140 working hours a month; keep ~40 for lab tests, marketing and admin, so ~100 h for coaching. For example 30 Coaching (60 h) + 6 Elite (36 h) = 96 h.

**3. Revenue at the starting prices** (before VAT and costs): 30 × 119 € + 6 × 229 € ≈ **4,940 €/month**, plus one-off lab tests and Plan subscriptions on top, which scale almost without Jaka's time (e.g. 200 × 25 € = 5,000 € for ~20 h).

**4. Costs to subtract:** Stripe (~1.5 % + 0.25 € per EU card payment), lab consumables per test (lactate strips etc., **❓** Jaka to list), ads, hosting (small), AI usage, VAT if the company is registered for it (**❓** are prices shown with VAT included?).

**5. Check against the market:** the cheapest real alternatives (online coaching from Slovenian coaches and clubs, and apps such as Runna). Coaching must be clearly more than an app (Jaka + lab tests) and Elite clearly more than Coaching (in-person).

**6. Launch with founding prices.** The first 20 athletes get −30 % for life in exchange for feedback. This tests demand without discounting the public price later. Raise prices when spots fill up; don't lower them when they don't (change the offer instead).

How to proceed: Jaka lists the consumables cost per test and his realistic hours, then Grega sets the numbers in this table. The packages live in the database, so prices can change without code.

## Training data
**Strava is out.** Its API Policy (effective 1 June 2026) bans using Strava data in any AI application, including putting it in a prompt (§5.3), and lets data be shown only to the athlete it belongs to, not a coach (§2.3, §5.13, §6.2).

### From day one: file upload
- **.FIT** (all Garmin, COROS, Polar, Suunto and Wahoo devices; the richest format: HR, power, cadence, laps, sport), **.TCX**, **.GPX**. Parse FIT with Garmin's official FIT SDK (`@garmin/fitsdk`).
- Upload one or many files at once (drag & drop on web, share sheet on mobile later). Deduplicate by start time + device.
- Store the parsed summary plus the per-second streams we need (HR, pace/speed, power, altitude) and keep the original file.
- Show the athlete how to export from each brand (short help page per brand).

### Later: automatic connections (in this order)
| Source | Status | Notes |
|---|---|---|
| **Garmin Connect** (Activity + Training API) | Not planned for now (decided 2026-10-21) | AI allowed with explicit consent and an AI statement in the privacy policy (§15.10). Coach view allowed with attribution. Can push workouts to the watch. Developers report the application form may be down; check first. |
| **Polar AccessLink** | Self-serve, free | No AI clause. Sharing with Jaka needs the athlete's explicit permission (§3.1.1). **❓** §2.2 bans "a service similar to or competing with Polar Ecosystem": ask Polar before building. |
| **Suunto** | Partner programme + review | AI terms are behind the partner login; Suunto already lists AI coaching apps (Humango, AI Endurance) as partners. |
| **COROS** Partner API | Needs an established user base | Webhooks, FIT, push plans to the watch. Until then: COROS MCP (self-serve; read its terms first). |
| **Apple Health / Android Health Connect** | With the Expo app | Covers almost every watch through the phone. Needs explicit consent; disclose AI use. |

All sources feed the same `activities` table, so the dashboards and the engine don't care where a workout came from.

## Coaching engine (automatic, AI inside)
Plans, analyses and reports are produced **automatically and fast**, with no approval step. Customers never see the word AI: the site, app and emails talk about "your plan", "your analysis", "your report". The engine runs as background jobs through claude-pool (decided); the code calls one internal interface, so the provider can be swapped later.

**Speed targets:**
| Trigger | Result | Target |
|---|---|---|
| Workout file uploaded | analysis of that workout + updated week | < 2 min |
| Lab results entered by the coach | lab report + zones in the customer's account, email sent | < 5 min |
| New subscriber finishes onboarding | first training block + this week | < 10 min |
| Daily check-in sent | today's workout adjusted | < 1 min |
| Sunday evening | weekly summary + next week's plan for every athlete | done by Monday 06:00 |

1. **Lab report**: interpretation, zones and "what this means for your training", sent as soon as the coach has entered the measured values. **Built first**: it needs no wearable data and it sells the subscriptions.
2. **Plans**: from goal, race date, available days and hours, zones and training history, a training block and next week. Follows Jaka's written method.
3. **Workout and weekly analysis**: planned vs done, load and fatigue trend, HR drift, missed sessions, a short summary, and next week adjusted.
4. **Daily check-in**: sleep, fatigue, soreness, illness in 10 seconds; today's workout adjusted.
5. **Coach briefing**: every morning, the athletes who need a human (internal only).

**Messages are not automated.** When an athlete writes a message, the coach answers it (the engine may suggest a reply in the coach area, but a person sends it). This keeps us out of the EU AI Act rule that people talking to an AI must be told so (art. 50).

**Guardrails replace approval.** With no human approving, every output passes an automatic check before the customer sees it:
- **Rule check (code, not AI):** every plan and change is validated against the hard rules in `docs/coaching-method.md` (e.g. at most +10 % weekly volume, no two threshold days in a row below advanced, rest after illness). Failing output is regenerated once, and if it fails again it goes to the coach and the customer sees "your coach is preparing this".
- **Red flags stop the engine for that athlete:** pain, injury, chest symptoms, illness, signs of overtraining or under-fuelling. The athlete gets a fixed, pre-written message (rest, see a doctor if needed); the coach is alerted at once.
- **The coach can always see and change everything** (an activity feed of what was sent, with one-tap edit or undo), but nothing waits for him.
- **Spot checks:** the coach area shows a daily sample of outputs to read, to catch quality drift.
- Every output is stored with its inputs, so the coach can see why it said what it did.

**What customers see while it works:** every automatic step has a visible status in their overview ("analysing your workout…", "preparing next week…", "ready"). It updates live, so the app feels instant even when a job takes a minute.

**Jaka's method** (`docs/coaching-method.md`, written by Claude, reviewed by Jaka) is what makes the output "Jaka's" and what the rule check enforces.

**Honesty limits (keep these, they protect the business):**
- Describe what the customer gets truthfully. The Plan package says "a plan built on Jaka's method that adapts to your training", **not** "Jaka writes your plan". Personal contact is promised only where it exists (Coaching and Elite: calls, comments, sessions). Claiming personal work that doesn't happen is a misleading commercial practice under EU consumer law.
- Never claim "no software" or "handwritten".
- The privacy policy lists the AI service provider among the processors and explains that plans and analyses are produced automatically from the athlete's data, with a coach responsible for the method and available on request (GDPR art. 13 and 22). Neutral legal wording, on the legal page only.

## Customer overview
Every customer has one overview page (`/account`) that shows everything about them at a glance, and it grows with each phase:
- **Phase 1:** next booking (with preparation instructions and a countdown), past bookings, profile.
- **Phase 2:** latest lab results, zones, report, progress between tests, "next test due".
- **Phase 3:** this week's plan, today's workout, recent workouts with their analysis, package and credits left, next payment.
- **Phase 4:** weekly summary, check-in, messages with the coach.

Each block shows its processing status when something is being prepared. The coach has the same overview for each athlete, plus the activity feed of what the engine sent.

## Booking
- Each coach sets a weekly availability plus exceptions. Test and session types have duration, price and preparation instructions.
- Locations: Jaka's home is the default lab; a booking can use another location (address in the confirmation email).
- The customer picks a slot, then pays (Stripe) or uses a credit.
- Automatic emails: confirmation, preparation (no hard training 24 h before; fasted for the fat/carb test; what to bring), reminder 24 h before.
- Free cancellation up to 24 h before. Later: no-show policy.
- Bookings sync to the coach's Google Calendar.

## Languages
- English and Slovenian everywhere: site, app, emails, plans and reports.
- URLs `/en/...` and `/sl/...`. The first visit picks the browser language (Slovenian → `/sl`, everything else → `/en`), then the choice is remembered.
- Each user has a language setting that emails and reports follow.
- Content (texts, test descriptions, packages) is stored in both languages from the start. Slovenian originals in `docs/content/` need an English version (Claude drafts it, Jaka checks).

## Brand
No logo exists. In phase 1, design a simple brand: wordmark + mark for "Jaka Marinko — Endurance Performance", 2–3 colours, a type pairing, and how photos are used. It must work small (favicon, app icon, watch-sized) and in dark mode. Never take anything from the old Lovable design.

## Marketing and ads
Channels: Jaka's Instagram and Strava profile (posting, not the Strava API), and paid ads (Meta/Instagram first, Google later).
- **Landing pages per offer** (lab tests, Coaching, race preparation) in both languages, each with one clear action.
- **Measurement:** cookie consent banner (GDPR: no ad tracking before consent), privacy-friendly analytics, Meta pixel + Conversions API and Google tag only after consent, UTM parameters on every ad and Instagram/Strava link.
- **Conversion events:** booking started, booking paid, package started, contact sent. These tell which ad brings paying customers.
- **Lead capture:** a free item for email sign-ups (e.g. a "zone calculator" or a race-prep checklist) feeding a simple newsletter.
- **Proof:** results and testimonials of athletes (with consent) on the site. Jaka's own results stay central.

## Privacy (GDPR)
Heart rate, lab results and how someone feels are health data (GDPR art. 9).
- Explicit consent at sign-up to processing health data for coaching. It can be withdrawn.
- Privacy policy with a list of every processor (hosting, backups, email, Stripe, the AI service provider, analytics), in neutral legal wording. If a device connection later requires a specific statement (e.g. Garmin §15.10), it is added then.
- Data export and account deletion from the athlete's settings.
- Data stays in the EU (t4a and the storage box are in Germany).

## Phases
0. **Groundwork.** pnpm + Turborepo, i18n (EN/SL), brand, cookie consent + analytics.
1. **Public site + landing pages + booking + test-only accounts.** Replaces the Lovable site and is what ads point to; earns money from day one. Done when a stranger, in either language, can book and pay for a lab test, gets confirmation and preparation emails, Jaka sees it in his calendar, and the booking shows up as a conversion with its ad source.
2. **Lab results + lab report + zones.** The coach enters results; the report and zones appear in the customer's overview within minutes and by email. Ends with the subscription offer.
3. **Subscriptions + credits + file upload + plans.** Stripe billing, credits, FIT/TCX/GPX upload, automatic plans and workout analysis with the rule check, athlete week view, coach overview and activity feed.
4. **Weekly analysis, daily check-in, messages with the coach, coach briefing.**
5. **Expo mobile app** (plan, check-in, upload from phone, Apple Health / Health Connect, push notifications).
6. **Device connections** once file upload limits growth: Polar, Suunto, COROS, Garmin.

## Data model sketch
```
users              id, name, email, locale (en | sl), role (customer | athlete | coach | head_coach | owner)
coaches            id, user_id, active
athletes           id, user_id, coach_id, sports[], birth_year, goal, race_date, availability jsonb
locations          id, name, address, is_default
consents           user_id, kind (health_data | marketing), granted_at, withdrawn_at
packages           id, name, price, interval, credit_rules jsonb
subscriptions      id, athlete_id, package_id, stripe_subscription_id, status, current_period_end
credits            id, athlete_id, kind (lactate | performance | session), granted_at, expires_at, used_booking_id
service_types      id, kind (lab_test | session), name, duration_min, price, prep_instructions
availability       coach_id, weekday, start, end      + availability_exceptions
bookings           id, service_type_id, coach_id, location_id, customer_id, start, status, paid_via (stripe | credit),
                   stripe_payment_id, utm jsonb
lab_tests          id, athlete_id, booking_id, date, type, results jsonb, zones jsonb, report_md, report_sent_at
activities         id, athlete_id, source (file | garmin | polar | ...), source_id, sport, start, duration, distance,
                   elevation, avg_hr, avg_power, summary jsonb, streams_key, original_file_key
planned_workouts   id, athlete_id, date, sport, target jsonb, zone, description, status (planned | done | skipped), activity_id
jobs               id, kind, athlete_id, status (queued | running | done | failed | held), progress, created_at, finished_at
                   -- drives the live "processing" status in the overview
engine_outputs     id, job_id, kind, athlete_id, input jsonb, output jsonb, rule_check jsonb, sent_at, edited_by, model
red_flags          id, athlete_id, source (check_in | message | workout), reason, created_at, handled_by, handled_at
comments           id, author_id, athlete_id, planned_workout_id?, body, created_at
requests           id, kind (contact), name, email, phone, message, status
```
Better Auth keeps its own tables. Original workout files and streams go to object storage, not Postgres. Texts shown to customers (packages, service types, prep instructions) have an `en` and `sl` version.

## Tech
Web: Next.js 16, Tailwind, shadcn/ui, TanStack Query, Zod, Recharts. API: Hono + Drizzle + Postgres (live on t4a), Better Auth (Google + email). Payments: Stripe (Checkout, Billing, Customer Portal); RevenueCat only with in-app subscriptions. Files: FIT SDK, TCX/GPX parsers. Monorepo: move to pnpm + Turborepo with `db`, `auth`, `api`, `types` packages **before** phase 1 code. Tests: Vitest + Playwright. Deploy as today (`infra/README.md`).

## Open questions
1. Email sender: Gmail or an address on jakamarinko.com? (Grega)
2. Jaka's qualifications and liability insurance for max-effort lab tests (to add to the site).
3. Lab: equipment, tests per week, consumables cost per test.
4. Are prices shown with VAT included?
5. Full-resolution photos (to add).

## Building it
How the work is split into tasks for parallel agents: [plan/README.md](plan/README.md).
