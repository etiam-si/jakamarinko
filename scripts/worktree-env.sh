#!/usr/bin/env bash
# Gives this worktree its own web/api ports and database jm_<branch>, written to .env.local,
# which `pnpm dev` and `pnpm e2e` read. Safe to run again: keeps its ports and any other lines in .env.local.
set -euo pipefail

root=$(git rev-parse --show-toplevel)
cd "$root"
compose=(docker compose -f dev/compose.yml)
pg_port=${JM_PG_PORT:-54320}

branch=$(git rev-parse --abbrev-ref HEAD)
db="jm_$(printf '%s' "$branch" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g' | cut -c1-60)"

# Ports handed to other worktrees count as taken, even while their dev servers are stopped.
taken=$(git worktree list --porcelain | sed -n 's/^worktree //p' | while read -r wt; do
  if [ "$wt" != "$root" ] && [ -f "$wt/.env.local" ]; then sed -n 's/^\(WEB\|API\)_PORT=//p' "$wt/.env.local"; fi
done)

# Asks for listening sockets instead of connecting: on WSL a connect to a closed port hangs for minutes.
in_use() {
  grep -qx "$1" <<<"$taken" && return 0
  if command -v ss >/dev/null; then ss -Hltn "sport = :$1" | grep -q .
  else lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; fi
}

web_port=""
[ -f .env.local ] && web_port=$(sed -n 's/^WEB_PORT=//p' .env.local)
if [ -z "$web_port" ]; then
  for p in $(seq 3000 10 3990); do
    if ! in_use "$p" && ! in_use $((p + 1)); then web_port=$p; break; fi
  done
fi
[ -n "$web_port" ] || { echo "no free port pair between 3000 and 3991" >&2; exit 1; }
api_port=$((web_port + 1))

"${compose[@]}" up -d --wait >/dev/null
if [ "$("${compose[@]}" exec -T postgres psql -U postgres -tAc "select 1 from pg_database where datname = '$db'")" != 1 ]; then
  "${compose[@]}" exec -T postgres createdb -U postgres "$db"
fi

keys='^(WEB_PORT|API_PORT|API_URL|DATABASE_URL)='
{
  [ -f .env.local ] && grep -Ev "$keys" .env.local || true
  echo "WEB_PORT=$web_port"
  echo "API_PORT=$api_port"
  echo "API_URL=http://localhost:$api_port"
  echo "DATABASE_URL=postgres://postgres:postgres@localhost:$pg_port/$db"
} >.env.local.tmp
mv .env.local.tmp .env.local

echo "web http://localhost:$web_port  api http://localhost:$api_port  database $db  (written to .env.local)"
