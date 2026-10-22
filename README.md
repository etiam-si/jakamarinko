# jakamarinko

pnpm + Turborepo monorepo:
- `apps/web`: Next.js (jakamarinko.com), `/en` and `/sl`
- `apps/api`: the shared backend, Hono under `/api` (jakamarinko.com/api), used by web and the mobile app. `src/worker.ts` runs the background jobs in `src/jobs/`.
- `packages/db`: Drizzle client, schema (`src/schema/<domain>.ts`) and migrations
- `packages/api`: Zod contracts and the typed api client, shared by api, web and mobile
- `packages/types`: shared enums (`Locale`, `Sport`, `Role`) and the catalog
- `packages/email`: `sendEmail()`; in dev it writes to the console and `.emails/`
- `packages/auth`: Better Auth (T03)
- `apps/mobile`: Expo, not added yet

## Commands
```
docker compose -f dev/compose.yml up -d   # one Postgres for all worktrees (once)
scripts/worktree-env.sh                   # once per worktree: ports + database jm_<branch> in .env.local
pnpm install
pnpm dev                 # web + api + worker with this worktree's ports and database
pnpm typecheck && pnpm test && pnpm build
pnpm e2e                 # Playwright; builds, then starts web + api itself
pnpm db:generate         # after schema changes
```
The script prints this worktree's URLs; the web dev server proxies `/api` to its own api.

How work is split between agents: [docs/plan/README.md](docs/plan/README.md). Deploys to t4a from `main`: [infra/README.md](infra/README.md).

What the app should become: [docs/product.md](docs/product.md). Content and prices: [docs/content/jaka-marinko.md](docs/content/jaka-marinko.md).
