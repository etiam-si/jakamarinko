import { and, eq, isNull } from "drizzle-orm";
import { db } from "@jakamarinko/db";
import { consentKinds, consents } from "@jakamarinko/db/schema";

export type ConsentKind = (typeof consentKinds)[number];

// The text the user agreed to. Bump it when the consent wording or the privacy policy changes in substance.
export const CONSENT_VERSION = "2026-10-22";

export async function activeConsents(userId: string): Promise<Record<ConsentKind, boolean>> {
  const rows = await db()
    .select({ kind: consents.kind })
    .from(consents)
    .where(and(eq(consents.userId, userId), isNull(consents.withdrawnAt)));
  const active = new Set(rows.map((r) => r.kind));
  return Object.fromEntries(consentKinds.map((k) => [k, active.has(k)])) as Record<ConsentKind, boolean>;
}

export async function hasConsent(userId: string, kind: ConsentKind) {
  return (await activeConsents(userId))[kind];
}

// Granting again while a grant is active changes nothing.
export async function grantConsent(userId: string, kind: ConsentKind) {
  await db().insert(consents).values({ userId, kind, version: CONSENT_VERSION }).onConflictDoNothing();
}

// Never deletes: the row keeps when it was granted and gets when it was withdrawn.
export async function withdrawConsent(userId: string, kind: ConsentKind) {
  await db()
    .update(consents)
    .set({ withdrawnAt: new Date() })
    .where(and(eq(consents.userId, userId), eq(consents.kind, kind), isNull(consents.withdrawnAt)));
}
