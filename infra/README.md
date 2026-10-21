# Infrastructure

## Traffic
```
Browser ─HTTPS─> Cloudflare (proxy) ─HTTPS, origin cert─> Traefik :443 (/srv/edge) ─┬─ jakamarinko.com/api/* ──> api:3000
                                                                                    └─ jakamarinko.com/*     ──> web:3000
```
- Server `t4a` (`77.42.42.60`, Hetzner, Ubuntu 26.04). It also runs rokomet-stats (`rokomet.etiam.si`).
- Cloudflare zone `jakamarinko.com`: `A jakamarinko.com → 77.42.42.60`, proxied (orange cloud), SSL mode **Full (strict)**.
- Origin certificate (`*.jakamarinko.com`, `jakamarinko.com`, valid until 2041): `/srv/edge/certs/jakamarinko.com/origin.{pem,key}`.

## Edge proxy (`infra/edge/`, server-wide)
One Traefik owns :443 for every app on t4a. It is not deployed by CI; change it by hand:
```
scp infra/edge/compose.yml infra/edge/traefik.yml t4a:/srv/edge/
scp infra/edge/dynamic/*.yml t4a:/srv/edge/dynamic/     # picked up live, no restart
ssh t4a 'cd /srv/edge && docker compose up -d'
```
- `dynamic/tls.yml`: one origin cert per Cloudflare zone in `/srv/edge/certs/<zone>/`. Traefik picks the cert by SNI.
- `dynamic/middlewares.yml`: `cloudflare-only` (403 for anything not from https://www.cloudflare.com/ips/; Docker-published ports skip ufw) and `compress`. Both run on every route. If Cloudflare changes its ranges, update this file and `traefik.yml`.
- Traefik only routes to containers that have the `traefik.enable=true` label and are on the external `edge` network.

### Adding another app to t4a
1. In the app's `compose.yml`, put the web-facing service on the external network `edge` and add the labels
   `traefik.enable=true`, `traefik.http.routers.<name>.rule=Host(\`example.com\`)` and `traefik.http.services.<name>.loadbalancer.server.port=<port>`.
   Router names must be unique on the whole server.
2. New Cloudflare zone: create an origin cert, put it in `/srv/edge/certs/<zone>/`, and add it to `dynamic/tls.yml`.

## Postgres (`infra/postgres/`, server-wide)
One Postgres 18 in `/srv/postgres` for every app on t4a, one database + owner role per app. No published port: apps join the external `db` network and connect to `postgres:5432`. The superuser password is in `/srv/postgres/.env`.
- New app database: `ssh t4a sh /srv/postgres/new-app-db.sh <name>` prints a `DATABASE_URL`; put it in that app's `.env`.
- psql: `ssh -t t4a 'cd /srv/postgres && docker compose exec postgres psql -U postgres <db>'`.
- Changed by hand like the edge proxy: `scp infra/postgres/* t4a:/srv/postgres/ && ssh t4a 'cd /srv/postgres && docker compose up -d'`.
- When load grows, move it to managed Postgres or its own server. Apps only know `DATABASE_URL`.

## Backups (`infra/backup/`, server-wide)
`/etc/cron.d/t4a-backup` runs `/usr/local/bin/t4a-backup` at 04:00 (after rokomet's 03:30 `app.db` copy). It dumps every Postgres database to `/var/backups/postgres`, then backs up those dumps, `/srv` (all `.env`, compose files, certs, claude-pool accounts, rokomet's `app.db` copies), `/etc/cron.d` and `/usr/local/bin` with restic.
- Target: Hetzner Storage Box `u578499` (`t4a-backup`), repo `restic/t4a-production`, over SFTP as the `storagebox` alias in `/root/.ssh/config` (key `/root/.ssh/storagebox`). `restic/t4a-t2` on the same box belongs to another server (`server1-t4a`): never touch it.
- Encrypted with `/root/.restic-password`. **Keep a copy outside t4a**, without it the backups can't be read.
- Keeps 7 daily, 4 weekly, 6 monthly. Sundays it also reads back 5 % of the data. Log: `/var/log/t4a-backup.log`.
- Restore, e.g. one database:
  ```
  export RESTIC_REPOSITORY=sftp:storagebox:restic/t4a-production RESTIC_PASSWORD_FILE=/root/.restic-password
  restic snapshots
  restic dump latest /var/backups/postgres/jakamarinko.dump | docker exec -i postgres-postgres-1 pg_restore -U postgres -d jakamarinko --clean
  restic restore latest --target /tmp/restore --include /srv/jakamarinko    # files
  ```

## This app (`infra/compose.yml` → `/srv/jakamarinko`)
- `web`: `ghcr.io/etiam-si/jakamarinko-web:<sha>`, Next.js standalone.
- `api`: `ghcr.io/etiam-si/jakamarinko-api:<sha>`, Hono. Gets `/api/*` (router priority 100 beats web). Also on the `db` network; database `jakamarinko`. Tables in `apps/api/src/schema.ts` (Drizzle); `npm run db:generate -w apps/api` writes a migration to `apps/api/drizzle/`, which the api applies on start. `/api/health` checks the database, so a deploy with a broken connection fails.
- Runtime secrets go in `/srv/jakamarinko/.env` (owner `deploy`, mode 600). Both services read it.

## Deploy (`.github/workflows/deploy.yml`)
Push to `main`: **check** (typecheck, test, build), then **images** (web and api to GHCR), then **deploy** (scp `compose.yml`, `docker compose pull && up -d` as `deploy`, poll `https://jakamarinko.com/api/health` and `/`). Pull requests only run check.

Repo secrets: `DEPLOY_HOST`, `DEPLOY_SSH_KEY` (its public half is in `~deploy/.ssh/authorized_keys` as `github-actions@jakamarinko`), `DEPLOY_KNOWN_HOSTS`.

Rollback: run the workflow by hand with `tag=<older sha>`. Or on the server: `cd /srv/jakamarinko && IMAGE_TAG=<sha> docker compose up -d`.

## Mobile (Expo)
Not in the repo yet. Add it as `apps/mobile` (`npx create-expo-app@latest apps/mobile`). It ships through EAS, not this server, and talks to `https://jakamarinko.com/api`. Shared types live in `packages/shared`.
