import { eq, notInArray } from "drizzle-orm";
import { db } from "@jakamarinko/db";
import { availability, coaches, locations, serviceTypes, users } from "@jakamarinko/db/schema";
import { bookable } from "./catalog";

// A SAMPLE week until Jaka gives his real hours: Mon–Fri 16:00–20:00, Sat 09:00–13:00 at the default location.
// Change it here (weekday 1 = Monday), or in the coach's availability once T12 has a screen for it.
export const sampleWeek = [
  { weekday: 1, start: "16:00", end: "20:00" },
  { weekday: 2, start: "16:00", end: "20:00" },
  { weekday: 3, start: "16:00", end: "20:00" },
  { weekday: 4, start: "16:00", end: "20:00" },
  { weekday: 5, start: "16:00", end: "20:00" },
  { weekday: 6, start: "09:00", end: "13:00" },
];

// Safe on every api start. Service types follow the catalog (a service gone from it is deactivated, never deleted).
// The head coach gets the sample week only while they have no availability at all, so edits are never overwritten.
export async function seedBooking(source: NodeJS.ProcessEnv = process.env, log: Pick<Console, "warn"> = console) {
  for (const s of bookable) {
    const values = { kind: s.kind, durationMin: s.durationMin, priceCents: s.priceCents, active: true };
    await db()
      .insert(serviceTypes)
      .values({ catalogId: s.id, ...values })
      .onConflictDoUpdate({ target: serviceTypes.catalogId, set: values });
  }
  await db()
    .update(serviceTypes)
    .set({ active: false })
    .where(notInArray(serviceTypes.catalogId, bookable.map((s) => s.id)));

  const email = source.HEAD_COACH_EMAIL?.toLowerCase();
  const [coach] = email
    ? await db().select({ id: coaches.id }).from(coaches).innerJoin(users, eq(users.id, coaches.userId)).where(eq(users.email, email))
    : [];
  const [lab] = await db().select({ id: locations.id }).from(locations).where(eq(locations.isDefault, true));
  if (!coach || !lab) {
    log.warn("seed: no head coach or default location yet, skipping the sample availability");
    return;
  }
  const [any] = await db().select({ id: availability.id }).from(availability).where(eq(availability.coachId, coach.id)).limit(1);
  if (!any) await db().insert(availability).values(sampleWeek.map((d) => ({ ...d, coachId: coach.id, locationId: lab.id })));
}
