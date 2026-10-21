# Build plan: parallel agents

How phases 0–1 of [product.md](../product.md) are split into tasks that several agents can build at the same time in Orca, without stepping on each other. Phase 2 is outlined at the end and gets detailed task files once phase 1 is merged.

## How work flows
```
development ──┬── t01-brand ─────────PR──┐
              ├── t03-auth ──────────PR──┤   keeper merges in dependency order,
              ├── t06-email ─────────PR──┼─> development (always green)
              └── ...                    │
                                         └─> user merges PR development → main  =  deploy to jakamarinko.com
```
1. **Pick a task** whose dependencies are all merged into `development` (see the table).
2. Start an **Orca worktree from `development`**, branch `tNN-slug`, one agent per task.
3. Run `scripts/worktree-env.sh` once. It writes `.env.local` with ports and a database just for this worktree, so many worktrees can run `pnpm dev` side by side.
4. Build only what the task file says, inside the paths it owns.
5. Open a PR into `development` titled `[TNN] …`, with each acceptance criterion ticked and how it was checked.
6. **The keeper** (Orca tab `jm · keeper`) rebases or merges the PR into `development`, runs checks and fixes trivial hot-file conflicts. It sends real conflicts or failures back to the task's agent. No one else merges.
7. **Release:** when the user says so, the keeper opens `development → main`. Only the user merges it, and that deploys.

`main` is never touched by agents (see `CLAUDE.md`).

## Tasks
Size: S ≈ hours, M ≈ a day, L ≈ several days for one agent.

| ID | Task | Wave | Depends on | Size |
|---|---|---|---|---|
| [T00](tasks/T00-foundation.md) | Foundation: pnpm + Turborepo, packages, i18n, Tailwind/shadcn, dev env per worktree, CI | 0 | — | L |
| [T01](tasks/T01-brand.md) | Brand + design system (logo, colours, type, theme) | 1 | T00 | M |
| [T02](tasks/T02-content.md) | Content EN/SL + catalog (tests, packages, prices) | 1 | T00 | M |
| [T03](tasks/T03-auth.md) | Auth (Better Auth: Google + magic link), users, roles, consents | 1 | T00 | M |
| [T04](tasks/T04-coaching-method.md) | Coaching method document (for the AI and coaches) | 1 | — | M |
| [T05](tasks/T05-consent-analytics.md) | Cookie consent, analytics, UTM capture, `track()` | 1 | T00 | S |
| [T06](tasks/T06-email.md) | Email: templates EN/SL, transports | 1 | T00 | S |
| [T17](tasks/T17-legal.md) | Legal pages: privacy (with AI statement), terms, cookies | 1 | T00 | S |
| [T07](tasks/T07-booking-api.md) | Booking backend: services, availability, slots, bookings, reminders | 2 | T02, T03, T06 | L |
| [T08](tasks/T08-public-site.md) | Public site: home, about, coaching, lab, contact; SEO | 2 | T01, T02 | L |
| [T10](tasks/T10-app-shells.md) | App shells: coach area + customer account, role guards | 2 | T01, T03 | M |
| [T09](tasks/T09-contact.md) | Contact form + requests inbox | 3 | T03, T06, T08, T10 | S |
| [T11](tasks/T11-booking-ui.md) | Booking flow for customers | 3 | T05, T07, T08 | M |
| [T12](tasks/T12-booking-admin.md) | Coach: availability, bookings, cancel/reschedule | 3 | T07, T10 | M |
| [T15](tasks/T15-account.md) | Customer account: bookings, language, consents, export/delete | 3 | T07, T10 | M |
| [T13](tasks/T13-payments.md) | Stripe payments for bookings | 4 | T11 | M |
| [T14](tasks/T14-landing-ads.md) | Ad landing pages + conversion events (Meta CAPI) | 4 | T05, T08, T13 | M |
| [T16](tasks/T16-calendar-sync.md) | Google Calendar sync for coaches | 4 | T12 | S |

### Waves (how many agents can run at once)
| Wave | Tasks | Parallel agents |
|---|---|---|
| 0 | T00 (T04 can start anytime) | 1–2 |
| 1 | T01, T02, T03, T05, T06, T17 (+ T04) | up to 7 |
| 2 | T07, T08, T10 | 3 |
| 3 | T09, T11, T12, T15 | 4 |
| 4 | T13, T14, T16 | 3 |

**Phase 1 is done** when the T13 acceptance flow passes on production: a stranger books and pays for a lab test in English or Slovenian, gets the emails, and the coach sees it.

## Directory ownership
T00 creates this layout. Each task owns the paths listed in its file; nobody else edits them.
```
apps/web/src/
  app/[locale]/(site)/        public pages            T08 (booking/ T11, lp/ T14, legal/ T17)
  app/[locale]/(auth)/        sign-in                 T03
  app/[locale]/(app)/coach/   coach area              T10 shell, T12 bookings, T09 requests
  app/[locale]/(app)/account/ customer account        T10 shell, T15
  components/ui/              shadcn primitives       T00 adds, T01 themes
  components/<feature>/       one folder per feature  the feature's task
  messages/{en,sl}/<ns>.json  one file per namespace  the feature's task
  lib/                        web helpers             T00 (new files: the task that needs them)
apps/api/src/
  routes/<domain>.ts          one Hono sub-app per domain
  jobs/<name>.ts              background jobs (worker loop)
packages/
  db/src/schema/<domain>.ts   Drizzle tables per domain; migrations in packages/db/drizzle
  api/src/<domain>.ts         Zod contracts shared by api, web and (later) mobile
  auth/                       Better Auth config     T03
  email/                      templates + transports T00 stub, T06
  types/                      shared types + catalog T00, T02
```

## Hot files (shared by everyone)
Allowed: **adding your own lines**. Never reorder or reformat. On conflict, keep both sides.

| File | What you may add |
|---|---|
| `apps/api/src/app.ts` | one `app.route("/<domain>", …)` line |
| `packages/db/src/schema/index.ts` | one `export * from "./<domain>"` line |
| `packages/api/src/index.ts` | one export line |
| `apps/web/src/i18n/namespaces.ts` | one namespace name |
| `apps/web/src/lib/nav.ts` | one nav entry for your page (from T10 on) |
| `package.json` files, `pnpm-lock.yaml` | dependencies you need (on a lockfile conflict: take `development`'s lockfile, run `pnpm install`) |
| `.env.example` | your new variables, with a comment |

## Database migrations (the one thing that conflicts badly)
- Change only your own `schema/<domain>.ts`.
- Generate the migration in your branch, so it's reviewable and tests run.
- **Before the PR is merged, rebase on `development`, delete your generated migration files, and run `pnpm db:generate` again.** Never hand-merge `packages/db/drizzle/meta/`. The keeper checks this.
- No destructive migrations (drop/rename of a column with data) without saying so in the PR title.

## Running many agents locally
- One local Postgres for all worktrees: `docker compose -f dev/compose.yml up -d` (T00 adds it). Each worktree gets its own database `jm_<branch>`.
- `scripts/worktree-env.sh` picks a free port pair (web, api) and writes `.env.local`. Never hard-code ports.
- Emails in dev go to the console and `.emails/` (T06), never to real people.
- External keys (Stripe, Google OAuth, Meta) come from the user. Use test mode keys only. Missing key = feature disabled with a clear message, not a crash.

## Task file format
Every file in `tasks/` has: **Goal**, **Depends on**, **Owns**, **Hot files**, **Build**, **Acceptance criteria** (each one checkable by a command, a test or a browser step), **Out of scope**, **Needs from the user**.

## Keeper (Orca tab `jm · keeper`)
Prompt for the keeper session:
> You keep `development` of etiam-si/jakamarinko integrated and green. Watch PRs into `development`. For each: check the task's acceptance criteria are ticked, the PR stays inside the task's owned paths, migrations were regenerated after rebase, and `pnpm typecheck && pnpm test && pnpm build && pnpm e2e` pass. Merge in dependency order (docs/plan/README.md). Fix only trivial hot-file conflicts yourself; send everything else back to the task's agent. Never touch `main`; open `development → main` only when the user says "release".

## Phase 2 outline (task files come after phase 1)
| ID | Task | Depends on |
|---|---|---|
| T20 | Lab results: schema per test type, coach entry form, history | T10, T07 |
| T21 | Zones library: zones from lactate/VO₂max per sport (pure functions, heavily tested, follows `coaching-method.md`) | T04 |
| T22 | AI runner: `worker` container with claude-pool, job queue table, `ai_runs` log, one interface for all AI features | T00 |
| T23 | AI lab report: prompt from the coaching method, coach review/edit/approve, send (EN/SL) | T20, T21, T22 |
| T24 | Customer results view: tests, zones, report, subscription offer | T23, T15 |
