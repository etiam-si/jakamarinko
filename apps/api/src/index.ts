import { existsSync } from "node:fs";
import { serve } from "@hono/node-server";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { app } from "./app";
import { db } from "./db";

const port = Number(process.env.PORT ?? 3001);
const migrationsFolder = process.env.MIGRATIONS_DIR ?? "./drizzle";

// Apply new migrations before taking traffic. Nothing to do until the first `db:generate`.
if (existsSync(`${migrationsFolder}/meta/_journal.json`)) {
  await migrate(db(), { migrationsFolder });
}

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`api listening on :${info.port}`);
});
