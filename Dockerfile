# syntax=docker/dockerfile:1.7
# Three images from one file: `--target web` (Next.js standalone), `--target api` and `--target worker`
# (the Hono app and its background jobs, each bundled into one file).
# No secrets go in here; they come from /srv/jakamarinko/.env at runtime.

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1 TURBO_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# out/json holds only the manifests and lockfile, so the install layer stays cached until dependencies change.
# Both apps are kept: the typed api client in packages/api reads the api app's route types.
FROM base AS prune
COPY . .
RUN pnpm dlx turbo@2.11.10 prune @jakamarinko/web @jakamarinko/api-server --docker

FROM base AS build
COPY --from=prune /app/out/json/ ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY --from=prune /app/out/full/ ./
# Root files prune leaves out.
COPY --from=prune /app/tsconfig.base.json ./
RUN pnpm turbo run build

FROM node:24-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

FROM node:24-bookworm-slim AS api
WORKDIR /app
# Applies new migrations from /app/drizzle on start (packages/db, runMigrations).
ENV NODE_ENV=production PORT=3000 MIGRATIONS_DIR=/app/drizzle
COPY --from=build --chown=node:node /app/apps/api/dist/index.mjs ./
COPY --from=build --chown=node:node /app/packages/db/drizzle ./drizzle
USER node
EXPOSE 3000
CMD ["node", "index.mjs"]

FROM node:24-bookworm-slim AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/apps/api/dist/worker.mjs ./
USER node
CMD ["node", "worker.mjs"]
