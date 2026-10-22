import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@jakamarinko/db/schema";

// Tests only: an in-memory Postgres with the real migrations, used in place of db() via vi.mock.
export async function testDb() {
  const database = drizzle(new PGlite(), { schema });
  await migrate(database, { migrationsFolder: fileURLToPath(new URL("../../db/drizzle", import.meta.url)) });
  return database;
}
