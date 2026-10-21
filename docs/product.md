# jakamarinko.com: product plan

> **Status: draft v2 (2026-10-21).** Agreed in conversation, not yet validated with real customers. Points marked **❓** are open. Content and lab prices: [content/jaka-marinko.md](content/jaka-marinko.md). Never copy the old Lovable design. Jaka Torkar is not part of the project.

## In one paragraph
Jaka Marinko's endurance coaching and lab testing, run as one app. The thing that can't be copied is Jaka himself (national-team background, VO₂max 80) plus real lab data (lactate, VO₂max). AI is the lever that lets one coach serve many athletes: it drafts plans, analyses training and writes reports, and Jaka approves. We do **not** compete as a generic AI training app (Runna, TrainerRoad, Humango and Garmin Coach already own that); we sell Jaka + lab + data, with AI underneath.

```
Lab test ──> zones ──> AI drafts plan ──> Jaka approves ──> athlete trains ──> workout file / sync
   ▲                                                                                  │
   └──── "time for a retest" <──── AI weekly analysis <──── planned vs done ◄─────────┘
```

## Who uses it
| Role | Who | Needs |
|---|---|---|
| **Visitor** | Endurance athlete looking for a coach or a test | Understand the offer and prices, trust Jaka, book a test or start a package in a minute. |
| **Test-only customer** | Wants their numbers, not a coach | Book and pay for a test, get results, zones and a report in their account. |
| **Athlete** | Subscriber | This week's plan, zones, lab history, feedback on how training went. |
| **Coach (admin)** | Jaka | All athletes in one place, approve AI drafts, enter lab results, manage bookings. |

One coach (Jaka) at first. The data model keeps a `coach_id` so more coaches can be added later. **❓** Will other coaches ever join?

## Offer
Prices are guesses to validate with real customers before launch (see critique).

### Monthly packages
| | **AI plan** | **Coaching** ⭐ | **Elite** |
|---|---|---|---|
| For | Wants structure for little money; often after a test | Has a goal and wants Jaka | Competitors |
| Plan | AI, on its own (within Jaka's rules) | AI drafts, **Jaka approves** | AI drafts, Jaka approves and adjusts |
| Analysis | weekly AI summary | weekly AI summary + Jaka's comment | same, plus daily adjustments |
| Lab tests | −20 % | lactate test every 3 months included | lactate every 2 months + Performance package 2×/year |
| Contact with Jaka | — (AI chat) | reply within 48 h + monthly call | reply within 24 h + call every two weeks + 2 in-person sessions/month |
| Rough price | ~25 €/mo | ~119 €/mo | ~229 €/mo |

Minimum 3 months on Coaching and Elite. Paying a year up front: 2 months free.

### One-off
- **Lab tests** at the existing prices (VO₂max 90 €, lactate 90 €, both 150 €, fat/carb use 130 €, running economy 80 €, anthropometry 50 €, Performance package 250 €). Every test ends with an offer: 30 days of AI plan free, or the first month of Coaching at −50 %.
- **Personal training**: one session (e.g. 45 €), or a pack of 10 at a discount.
- **Race preparation**: a 12–16-week block for one race, with a test at the start and end, paid once.

### Credits
Packages give credits on a schedule (e.g. Coaching: 1 lactate test every 3 months; Elite: 2 in-person sessions a month). A credit is spent by booking. Jaka sees unused and overdue credits, and the app reminds the athlete. Stripe handles billing; credits are our own simple ledger.

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
| **Garmin Connect** (Activity + Training API) | Apply as soon as there is a registered business | AI allowed with explicit consent and an AI statement in the privacy policy (§15.10). Coach view allowed with attribution. Can push workouts to the watch. Developers report the application form may be down; check first. |
| **Polar AccessLink** | Self-serve, free | No AI clause. Sharing with Jaka needs the athlete's explicit permission (§3.1.1). **❓** §2.2 bans "a service similar to or competing with Polar Ecosystem": ask Polar before building. |
| **Suunto** | Partner programme + review | AI terms are behind the partner login; Suunto already lists AI coaching apps (Humango, AI Endurance) as partners. |
| **COROS** Partner API | Needs an established user base | Webhooks, FIT, push plans to the watch. Until then: COROS MCP (self-serve; read its terms first). |
| **Apple Health / Android Health Connect** | With the Expo app | Covers almost every watch through the phone. Needs explicit consent; disclose AI use. |

All sources feed the same `activities` table, so the AI and dashboards don't care where a workout came from.

## AI
Runs as background jobs. **❓** In production, through the Anthropic API under commercial terms, not claude-pool (see critique). The code calls one internal interface so the provider can change.

1. **Lab report**: from the measured values, writes the interpretation, zones and "what this means for your training". Jaka checks it before it's sent. **Built first**: it needs no wearable data and it sells the subscriptions.
2. **Plan drafts**: from goal, race date, available days and hours, zones and training history, drafts a block and next week. Follows Jaka's written method.
3. **Weekly analysis**: planned vs done, load and fatigue trend, HR drift, missed sessions. A short summary in Slovenian for the athlete, and a draft adjustment of next week.
4. **Daily check-in**: sleep, fatigue, soreness, illness in 10 seconds; adjusts today's workout.
5. **Ask the coach**: answers from the athlete's own data and passes anything risky to Jaka.
6. **Coach briefing**: every morning, the athletes who need Jaka's attention.

**Jaka's method** (`docs/coaching-method.md`, to be written with Jaka): zones model, periodization, how load progresses per sport, taper rules, what he never does. Without it the AI writes generic plans.

**Guardrails (from day one):**
- Never diagnoses. Pain, injury, chest symptoms or illness → plan paused, Jaka notified, advise seeing a doctor.
- Hard limits on load increase (e.g. at most +10 % weekly volume).
- On Coaching and Elite, nothing reaches the athlete without Jaka's approval.
- Every AI output is stored with its inputs, so Jaka can see why it said what it said.

## Booking
- Jaka sets a weekly availability plus exceptions, and test/session types with duration, price and preparation instructions.
- The customer picks a slot, then pays (Stripe) or uses a credit.
- Automatic emails: confirmation, preparation (no hard training 24 h before; fasted for the fat/carb test; what to bring), reminder 24 h before.
- Free cancellation up to 24 h before. Later: no-show policy.
- Jaka's bookings sync to his Google Calendar.
- **❓** Where the tests happen and on whose equipment.

## Privacy (GDPR)
Heart rate, lab results and how someone feels are health data (GDPR art. 9).
- Explicit consent at sign-up, separate from consent to AI processing. Both can be withdrawn.
- Privacy policy with an AI statement (also required by Garmin §15.10) and a list of every processor (hosting, email, Stripe, the AI provider).
- Data export and account deletion from the athlete's settings.
- Data stays in the EU (t4a and the storage box are in Germany).

## Phases
1. **Public site + booking + test-only accounts.** Replaces the Lovable site; earns money from day one. Done when a stranger can book and pay for a lab test, get confirmation and preparation emails, and Jaka sees it in his calendar.
2. **Lab results + AI lab report + zones.** Jaka enters results, AI drafts the report, Jaka sends it, and the customer sees results and zones in their account. Ends with the subscription offer.
3. **Subscriptions + credits + file upload + plans.** Stripe billing, credits, FIT/TCX/GPX upload, AI plan drafts with Jaka's approval, athlete week view, coach dashboard.
4. **Weekly analysis, daily check-in, chat, coach briefing.** Garmin connection once approved, then Polar.
5. **Expo mobile app** (plan, check-in, upload from phone, Apple Health / Health Connect, push notifications), then Suunto and COROS.

## Data model sketch
```
users              id, name, email, role (customer | athlete | coach | admin)
coaches            id, user_id
athletes           id, user_id, coach_id, sports[], birth_year, goal, race_date, availability jsonb
consents           user_id, kind (health_data | ai_processing | marketing), granted_at, withdrawn_at
packages           id, name, price, interval, credit_rules jsonb
subscriptions      id, athlete_id, package_id, stripe_subscription_id, status, current_period_end
credits            id, athlete_id, kind (lactate | performance | session), granted_at, expires_at, used_booking_id
service_types      id, kind (lab_test | session), name, duration_min, price, prep_instructions
availability       coach_id, weekday, start, end      + availability_exceptions
bookings           id, service_type_id, customer_id, start, status, paid_via (stripe | credit), stripe_payment_id
lab_tests          id, athlete_id, booking_id, date, type, results jsonb, zones jsonb, report_md, report_sent_at
activities         id, athlete_id, source (file | garmin | polar | ...), source_id, sport, start, duration, distance,
                   elevation, avg_hr, avg_power, summary jsonb, streams_key, original_file_key
planned_workouts   id, athlete_id, date, sport, target jsonb, zone, description, status (draft | approved), activity_id
ai_runs            id, kind, athlete_id, input jsonb, output jsonb, model, created_at, approved_by
comments           id, author_id, athlete_id, planned_workout_id?, body, created_at
requests           id, kind (contact), name, email, phone, message, status
```
Better Auth keeps its own tables. Original workout files and streams go to object storage, not Postgres.

## Tech
Web: Next.js 16, Tailwind, shadcn/ui, TanStack Query, Zod, Recharts. API: Hono + Drizzle + Postgres (live on t4a), Better Auth (Google + email). Payments: Stripe (Checkout, Billing, Customer Portal); RevenueCat only with in-app subscriptions. Files: FIT SDK, TCX/GPX parsers. Monorepo: move to pnpm + Turborepo with `db`, `auth`, `api`, `types` packages **before** phase 1 code. Tests: Vitest + Playwright. Deploy as today (`infra/README.md`).

## Open questions
1. Who owns the business, and how are revenue, costs and liability split? A registered business is also required for Garmin, COROS and Stripe.
2. How many hours a week does Jaka have? This caps the Coaching and Elite spots.
3. The lab: whose equipment, where, how many tests a week?
4. Is a professional qualification required to coach for money in Slovenia, and is liability insurance needed (max-effort lab tests)?
5. Coaching package prices, checked against real customers.
6. Slovenian only, or English too?
7. Full-resolution photos and a logo.
8. Emails from Gmail or from an address on jakamarinko.com?
