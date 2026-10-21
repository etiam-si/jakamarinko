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

## This app (`infra/compose.yml` → `/srv/jakamarinko`)
- `web`: `ghcr.io/etiam-si/jakamarinko-web:<sha>`, Next.js standalone.
- `api`: `ghcr.io/etiam-si/jakamarinko-api:<sha>`, Hono. Gets `/api/*` (router priority 100 beats web).
- Runtime secrets go in `/srv/jakamarinko/.env` (owner `deploy`, mode 600). Both services read it.

## Deploy (`.github/workflows/deploy.yml`)
Push to `main`: **check** (typecheck, test, build), then **images** (web and api to GHCR), then **deploy** (scp `compose.yml`, `docker compose pull && up -d` as `deploy`, poll `https://jakamarinko.com/api/health` and `/`). Pull requests only run check.

Repo secrets: `DEPLOY_HOST`, `DEPLOY_SSH_KEY` (its public half is in `~deploy/.ssh/authorized_keys` as `github-actions@jakamarinko`), `DEPLOY_KNOWN_HOSTS`.

Rollback: run the workflow by hand with `tag=<older sha>`. Or on the server: `cd /srv/jakamarinko && IMAGE_TAG=<sha> docker compose up -d`.

## Mobile (Expo)
Not in the repo yet. Add it as `apps/mobile` (`npx create-expo-app@latest apps/mobile`). It ships through EAS, not this server, and talks to `https://jakamarinko.com/api`. Shared types live in `packages/shared`.
