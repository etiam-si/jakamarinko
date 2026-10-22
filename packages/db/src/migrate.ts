import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./client";

// From source this is packages/db/drizzle. Bundled apps (the api image) pass the folder they ship.
const defaultFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

// Applies new migrations. Nothing to do until the first `pnpm db:generate`.
export async function runMigrations(migrationsFolder = defaultFolder) {
  if (!existsSync(`${migrationsFolder}/meta/_journal.json`)) return false;
  await migrate(db(), { migrationsFolder });
  return true;
}
