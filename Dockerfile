# syntax=docker/dockerfile:1.7
# Two images from one file: `--target web` (Next.js standalone) and `--target api` (bundled Hono server).
# No secrets go in here; they come from /srv/jakamarinko/.env at runtime.

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG TARGET
RUN npm run build -w apps/${TARGET}

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
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=node:node /app/apps/api/dist/index.mjs ./
COPY --from=build --chown=node:node /app/apps/api/drizzle ./drizzle
USER node
EXPOSE 3000
CMD ["node", "index.mjs"]
