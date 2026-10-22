import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { SessionUser } from "@jakamarinko/auth";
import { db } from "@jakamarinko/db";
import * as schema from "@jakamarinko/db/schema";
import { seedBooking } from "./seed";

// Tests only: an in-memory Postgres with the real migrations, used in place of db() via vi.mock.
export async function testDb() {
  const database = drizzle(new PGlite(), { schema });
  await migrate(database, { migrationsFolder: fileURLToPath(new URL("../../../../packages/db/drizzle", import.meta.url)) });
  return database;
}

const person = (id: string, role: SessionUser["role"]): SessionUser => ({ id, email: `${id}@example.com`, name: id, role, locale: "en" });

// Jaka (head coach, with the sample week), Maja (a coach without hours), two customers and an owner.
export const people = {
  jaka: person("jaka", "head_coach"),
  maja: person("maja", "coach"),
  ana: person("ana", "customer"),
  bo: person("bo", "customer"),
  owner: person("owner", "owner"),
};

// Fills whatever db() returns with the people above, the default location and the seeded services.
export async function seedFixtures() {
  await db()
    .insert(schema.users)
    .values(Object.values(people).map((p) => ({ ...p, emailVerified: true })));
  const [jaka, maja] = await db()
    .insert(schema.coaches)
    .values([{ userId: people.jaka.id }, { userId: people.maja.id }])
    .returning();
  const [lab] = await db().insert(schema.locations).values({ name: "Lab", address: "Testna 1, Ljubljana", isDefault: true }).returning();
  await seedBooking({ HEAD_COACH_EMAIL: people.jaka.email }, { warn: () => {} });
  return { jakaCoachId: jaka!.id, majaCoachId: maja!.id, labId: lab!.id };
}
