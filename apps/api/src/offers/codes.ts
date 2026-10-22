import { randomInt } from "node:crypto";
import { and, count, eq, ne } from "drizzle-orm";
import type { OfferCode } from "@jakamarinko/api";
import { bookings, offerCodes, offerRedemptions } from "@jakamarinko/db/schema";
import type { Q } from "../booking/calendar";

export type CodeRow = typeof offerCodes.$inferSelect;

// No 0/O, 1/I/L or 5/S: a code read out loud or copied from paper still works.
const alphabet = "ABCDEFGHJKMNPQRTUVWXYZ2346789";

// A random code like "JM-7KQ4-XPT9" (with a prefix) or "7KQ4XPT9".
export function newCode(prefix?: string) {
  const part = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return prefix ? `${prefix}-${part()}-${part()}` : `${part()}${part()}`;
}

export const normalizeCode = (code: string) => code.trim().toUpperCase();

// Uses by bookings that still count: a cancelled booking gives its use back.
export async function usesOf(q: Q, codeId: string) {
  const [row] = await q
    .select({ n: count() })
    .from(offerRedemptions)
    .innerJoin(bookings, eq(bookings.id, offerRedemptions.bookingId))
    .where(and(eq(offerRedemptions.codeId, codeId), ne(bookings.status, "cancelled")));
  return row?.n ?? 0;
}

// Inserts a code, making up a new one if a random one was taken (a chosen one that's taken is the caller's 409).
export async function insertCode(q: Q, values: Omit<typeof offerCodes.$inferInsert, "code">, prefix?: string) {
  for (let i = 0; i < 5; i++) {
    const [row] = await q
      .insert(offerCodes)
      .values({ ...values, code: newCode(prefix) })
      .onConflictDoNothing({ target: offerCodes.code })
      .returning();
    if (row) return row;
  }
  throw new Error("could not make a unique offer code");
}

export const codeView = (r: CodeRow, uses: number): OfferCode => ({
  id: r.id,
  code: r.code,
  kind: r.kind,
  discountType: r.discountType,
  value: r.value,
  services: r.services,
  maxUses: r.maxUses,
  uses,
  expiresAt: r.expiresAt?.toISOString() ?? null,
  email: r.email,
  note: r.note,
  recipientName: r.recipientName,
  active: r.active,
  createdAt: r.createdAt.toISOString(),
});

// What a code takes off a price; never more than the price.
export function saving(code: Pick<CodeRow, "discountType" | "value">, listCents: number) {
  if (code.discountType === "free") return listCents;
  if (code.discountType === "percent") return Math.min(listCents, Math.round((listCents * code.value) / 100));
  return Math.min(listCents, code.value);
}
