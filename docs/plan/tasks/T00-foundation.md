# T00 Foundation

**Goal:** turn the npm-workspaces skeleton into the monorepo every other task builds on, so that 7 agents can start in parallel the moment this merges. Nothing user-visible beyond a bilingual placeholder page.

**Depends on:** nothing. **Blocks:** every task except T04.

**Owns:** everything at the repo root, `apps/*` structure, `packages/*` structure, `dev/`, `scripts/`, `.github/workflows/`, `Dockerfile`, `infra/compose.yml`.

## Build
1. **pnpm + Turborepo.** Replace npm workspaces; `pnpm-workspace.yaml`, `turbo.json` with `dev`, `build`, `typecheck`, `test`, `e2e`, `db:generate` pipelines and caching. Root scripts as listed in `CLAUDE.md`. Pin pnpm with `packageManager`.
2. **Packages** (all TypeScript, ESM, consumed from source):
   - `packages/db`: Drizzle client + `schema/index.ts` + `drizzle/` migrations, moved from `apps/api`. Keep the existing "migrate on api start" behaviour.
   - `packages/api`: Zod contracts; move `Health` here. Export a typed Hono RPC client (`hc`) for web and mobile.
   - `packages/auth`: empty placeholder with a README pointing at T03.
   - `packages/email`: `sendEmail({to, subject, react|text, locale})` interface with a **console transport** (prints and writes `.emails/<timestamp>.html`). T06 adds real transports and templates.
   - `packages/types`: shared enums (`Locale = "en" | "sl"`, `Sport`, `Role`) and an empty `catalog.ts` for T02.
   - Remove `packages/shared`.
3. **Web** (`apps/web`):
   - Tailwind CSS v4 + shadcn/ui initialised. Add `button`, `input`, `label`, `card`, `dialog`, `select`, `checkbox`, `textarea`, `sonner`, `dropdown-menu`, `sheet`, `calendar`, `form`.
   - **i18n with next-intl:** `/en` and `/sl` routes, browser-language detection (Slovenian → `sl`, otherwise `en`), the choice kept in a cookie. Messages are loaded per namespace from `messages/{en,sl}/<ns>.json`, registered in `src/i18n/namespaces.ts`. A build-time check fails if a key exists in one language and not the other.
   - TanStack Query provider; Zod-validated env (`src/env.ts`).
   - Route groups from `docs/plan/README.md` created with placeholder layouts: `(site)`, `(auth)`, `(app)/coach`, `(app)/account`.
   - The placeholder home in both languages.
4. **API** (`apps/api`): one Hono sub-app per domain under `src/routes/`, mounted in `app.ts`. Zod-validated env. Error handler returning `{error: {code, message}}`. Add a **worker** entry (`src/worker.ts`) that runs jobs from `src/jobs/` on an interval, for reminders (T07) and AI (T22).
5. **Dev env per worktree:**
   - `dev/compose.yml`: one Postgres 18 for all worktrees.
   - `scripts/worktree-env.sh`: picks free ports for web and api, creates database `jm_<branch>`, writes `.env.local`.
   - `pnpm dev` reads it; the web dev server proxies `/api` to this worktree's api port.
6. **Tests:**
   - Vitest set up in every package and app.
   - Playwright in `apps/web/e2e` with one smoke test: `/` redirects to a locale, the page renders, and switching language works.
   - `pnpm e2e` starts web + api itself.
7. **Build and deploy:**
   - Dockerfile on pnpm (`turbo prune` / `pnpm deploy`), three targets: `web`, `api`, `worker`.
   - `infra/compose.yml` gains the `worker` service (on the `db` network, not on `edge`).
   - `.github/workflows/deploy.yml`:
     - Uses pnpm with the Turbo cache.
     - Runs check on PRs into `development` and `main`, and adds e2e to check.
     - Builds and pushes 3 images.
     - Deploys only from `main`, as today.
8. Docs: update `README.md` (commands) and `infra/README.md` (worker service).

## Acceptance criteria
- [ ] `pnpm install && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` pass from a clean clone.
- [ ] Two worktrees run `scripts/worktree-env.sh` + `pnpm dev` at the same time on different ports and databases. Each answers `GET /api/health` with 200.
- [ ] `/` redirects to `/sl` with `Accept-Language: sl` and to `/en` otherwise. The language switcher keeps the current page.
- [ ] Removing a key from `messages/sl/common.json` only makes `pnpm build` fail with a message naming the key.
- [ ] `docker build --target web|api|worker` all succeed. The api image still runs migrations on start.
- [ ] After merge to `main`: deploy succeeds and `https://jakamarinko.com/api/health` returns 200; `https://jakamarinko.com/sl` and `/en` render.
- [ ] The folders and hot files in `docs/plan/README.md` exist exactly as listed.

## Out of scope
Real design (T01), real texts (T02), auth (T03), real email sending (T06).

## Needs from the user
Nothing.
