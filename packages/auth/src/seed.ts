import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@jakamarinko/db";
import { coaches, locations, users } from "@jakamarinko/db/schema";
import type { Role } from "@jakamarinko/types";

const SeedEnv = z.object({
  OWNER_EMAIL: z.email().optional(),
  HEAD_COACH_EMAIL: z.email().optional(),
  // Jaka's home lab. Lives only in the server .env, never in git.
  LAB_ADDRESS: z.string().min(1).optional(),
});

// The people and place the app can't work without. Safe to run on every start: it never creates duplicates.
// A variable that isn't set skips its part with a warning, so the api still starts while the server .env is incomplete.
export async function seed(source: NodeJS.ProcessEnv = process.env, log: Pick<Console, "warn"> = console) {
  const env = SeedEnv.parse(source);
  for (const name of ["OWNER_EMAIL", "HEAD_COACH_EMAIL", "LAB_ADDRESS"] as const) {
    if (!env[name]) log.warn(`seed: ${name} is not set, skipping it`);
  }

  if (env.HEAD_COACH_EMAIL) {
    const userId = await upsertUser(env.HEAD_COACH_EMAIL, "head_coach");
    await db().insert(coaches).values({ userId }).onConflictDoNothing();
  }
  // After the head coach, so one person who is both ends up owner (owner ⊇ head_coach).
  if (env.OWNER_EMAIL) await upsertUser(env.OWNER_EMAIL, "owner");

  if (env.LAB_ADDRESS) {
    const [current] = await db().select().from(locations).where(eq(locations.isDefault, true));
    if (!current) await db().insert(locations).values({ name: "Jaka's home", address: env.LAB_ADDRESS, isDefault: true });
    else if (current.address !== env.LAB_ADDRESS) {
      await db().update(locations).set({ address: env.LAB_ADDRESS }).where(eq(locations.id, current.id));
    }
  }
}

async function upsertUser(email: string, role: Role) {
  const [row] = await db()
    .insert(users)
    .values({ id: randomUUID(), email: email.toLowerCase(), name: "", emailVerified: true, role })
    .onConflictDoUpdate({ target: users.email, set: { role } })
    .returning({ id: users.id });
  return row!.id;
}
