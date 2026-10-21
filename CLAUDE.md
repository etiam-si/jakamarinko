# jakamarinko

Jaka Marinko's endurance coaching + lab testing platform (web now, Expo mobile later). Read before working:
- What we build and why: [docs/product.md](docs/product.md)
- How work is split between parallel agents, and your task file: [docs/plan/README.md](docs/plan/README.md), `docs/plan/tasks/`
- Content (texts, results, prices, photos): [docs/content/](docs/content/)
- Server, deploy, Postgres, backups: [infra/README.md](infra/README.md)

## Git (machine rules, no exceptions)
- **Never commit to, merge into, rebase, reset or push `main`.** `main` deploys production; it changes only when the user merges a PR from `development`.
- Work in your own Orca worktree on a branch from `development`, named `tNN-short-slug` after your task (e.g. `t07-booking-api`).
- Open a PR into **`development`** titled `[TNN] <what it does>`. Never merge PRs yourself.
- Never skip git hooks. Never delete branches, worktrees or files with code in them.

## Your task
- Do only what your task file says. Stay inside the paths it **owns**. Touch shared ("hot") files only as `docs/plan/README.md` allows.
- If you need something another task owns, don't build it yourself: write it under "Blocked / needs" in your PR description and use a stub.
- Done = every acceptance criterion in your task file is checked off in the PR description, with how you verified it.

## Commands
```
pnpm install
pnpm dev                 # web + api with this worktree's ports and database (.env.local)
pnpm typecheck && pnpm test && pnpm build
pnpm e2e                 # Playwright
pnpm db:generate         # after schema changes (see migration rule in docs/plan/README.md)
```

## Rules for the code
- TypeScript strict, Zod at every boundary (API input, env, forms). Shared schemas live in `packages/api`.
- Every user-facing text in **English and Slovenian** via message files (`apps/web/messages/{en,sl}/<namespace>.json`). No hard-coded UI strings.
- Health data (heart rate, lab results, how someone feels) is GDPR special-category data: never log it, never send it anywhere without the consent the plan describes.
- Tests: Vitest for logic and API routes, Playwright for user flows. A bug fix comes with a test that failed before.
- Match the surrounding code: its comment density, naming and idioms. Small files, no speculative abstractions.

## Never
- Mention AI, artificial intelligence, models, "automated" or similar in anything a customer can see: site, app, emails, ads, package names, SEO, error messages. AI is an internal tool for coaches. The only exception is the processor list in the privacy policy (T17). Never claim the opposite either ("handwritten", "no software").
- Send anything generated to a customer without a coach approving it. Every draft goes to the coach's review queue.
- Mention or use anything about Jaka Torkar (old site's partner). He is not part of this project.
- Copy anything from the old Lovable site's design. Its texts are in `docs/content/` and that is all we take.
- Use the Strava API (its terms ban AI use; see docs/product.md).
