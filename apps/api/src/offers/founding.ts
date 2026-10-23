import { count, eq } from "drizzle-orm";
import { offerRules, type Founding } from "@jakamarinko/api";
import { db } from "@jakamarinko/db";
import { foundingAthletes, offerSettings } from "@jakamarinko/db/schema";
import type { Q } from "../booking/calendar";

// The settings row, made on first use.
async function settings(q: Q, lock = false) {
  await q.insert(offerSettings).values({ id: 1 }).onConflictDoNothing();
  const select = q.select().from(offerSettings).where(eq(offerSettings.id, 1));
  const [row] = lock ? await select.for("update") : await select;
  return row!;
}

export const foundingEnabled = async (q: Q) => (await settings(q)).foundingEnabled;

export async function setFoundingEnabled(enabled: boolean) {
  await settings(db());
  await db().update(offerSettings).set({ foundingEnabled: enabled }).where(eq(offerSettings.id, 1));
}

// Places left, counted from the database. Off means no places shown at all.
export async function foundingStatus(q: Q = db()): Promise<Founding> {
  const enabled = await foundingEnabled(q);
  const [row] = await q.select({ n: count() }).from(foundingAthletes);
  const taken = row?.n ?? 0;
  const places = offerRules.foundingPlaces;
  return { enabled, places, taken, left: enabled ? Math.max(0, places - taken) : 0 };
}

// A completed booking makes its customer a founding athlete while places are left and the offer is on.
// The settings row is locked, so two completions at once can't both take the last place.
export async function grantFounding(q: Q, email: string, bookingId: string) {
  const s = await settings(q, true);
  if (!s.foundingEnabled || !email) return false;
  const [row] = await q.select({ n: count() }).from(foundingAthletes);
  const taken = row?.n ?? 0;
  if (taken >= offerRules.foundingPlaces) return false;
  const [added] = await q
    .insert(foundingAthletes)
    .values({ email: email.toLowerCase(), number: taken + 1, bookingId })
    .onConflictDoNothing()
    .returning();
  return !!added;
}
