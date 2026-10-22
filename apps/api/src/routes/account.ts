import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, gt, gte, inArray, isNull, or } from "drizzle-orm";
import { strToU8, zipSync } from "fflate";
import { Hono } from "hono";
import { z } from "zod";
import {
  DeleteConfirmInput,
  isStaff,
  ProfileInput,
  type AccountBooking,
  type AccountExport,
  type ConsentRecord,
  type Profile,
} from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import { db } from "@jakamarinko/db";
import { bookings, consents, profiles, users, verifications } from "@jakamarinko/db/schema";
import { icsEvent, sendEmail } from "@jakamarinko/email";
import { locales, type Locale } from "@jakamarinko/types";
import { customerView, findBooking, findBookings, type BookingRow } from "../booking/bookings";
import { catalogItem, serviceName } from "../booking/catalog";
import { bookingConfig } from "../booking/config";
import { requireSession } from "../lib/auth";
import { ApiError } from "../lib/errors";
import { validate } from "../lib/validate";

const IdParam = z.object({ id: z.uuid() });
const LocaleQuery = z.object({ locale: z.enum(locales).optional() });
const active = ["confirmed", "pending_payment"] as const;
export const deleteLinkMinutes = 60;

const deleteIdentifier = (userId: string) => `account-delete:${userId}`;
const sha256 = (token: string) => createHash("sha256").update(token).digest("hex");

// Bookings made as a guest with the same email join the account, once the email is verified (magic link or Google).
async function claimGuestBookings(user: SessionUser) {
  const [row] = await db().select({ verified: users.emailVerified }).from(users).where(eq(users.id, user.id));
  if (!row?.verified) return;
  await db()
    .update(bookings)
    .set({ customerUserId: user.id })
    .where(and(isNull(bookings.customerUserId), eq(bookings.customerEmail, user.email.toLowerCase())));
}

const own = (user: SessionUser) => eq(bookings.customerUserId, user.id);

function accountBooking(row: BookingRow, locale: Locale, now: Date): AccountBooking {
  const item = catalogItem(row.service);
  return {
    ...customerView(row, now, bookingConfig()),
    serviceName: serviceName(row.service, locale),
    preparation: item.kind === "lab_test" ? item.preparation[locale] : [],
  };
}

async function profileOf(user: SessionUser): Promise<Profile & { id: string; role: string; createdAt: Date }> {
  // The overview asks for the profile and the bookings at the same time; either may be first after sign-in.
  await claimGuestBookings(user);
  const [row] = await db()
    .select({ user: users, phone: profiles.phone })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, user.id));
  if (!row) throw new ApiError(401, "unauthorized", "Sign in first");
  // No phone saved yet: the one from their latest booking, so the form starts filled in.
  const [latest] = row.phone ? [] : await db().select({ phone: bookings.customerPhone }).from(bookings).where(own(user)).orderBy(desc(bookings.createdAt)).limit(1);
  const { id, name, email, locale, role, createdAt } = row.user;
  return { id, name, email, locale, role, createdAt, phone: row.phone ?? latest?.phone ?? null };
}

async function consentHistory(userId: string): Promise<ConsentRecord[]> {
  const rows = await db().select().from(consents).where(eq(consents.userId, userId)).orderBy(desc(consents.grantedAt));
  return rows.map((r) => ({
    kind: r.kind,
    version: r.version,
    grantedAt: r.grantedAt.toISOString(),
    withdrawnAt: r.withdrawnAt?.toISOString() ?? null,
  }));
}

export async function exportData(user: SessionUser, now: Date): Promise<AccountExport> {
  const { createdAt, ...profile } = await profileOf(user);
  const rows = await findBookings(own(user));
  return {
    exportedAt: now.toISOString(),
    profile: { ...profile, createdAt: createdAt.toISOString() },
    consents: await consentHistory(user.id),
    bookings: rows.map((r) => {
      const { cancellable: _, ...view } = customerView(r, now, bookingConfig());
      return {
        ...view,
        // Their own health answers: part of what we hold about them.
        healthAnswers: r.booking.healthAnswers ?? null,
        utm: r.booking.utm ?? null,
        createdAt: r.booking.createdAt.toISOString(),
        cancelledAt: r.booking.cancelledAt?.toISOString() ?? null,
      };
    }),
  };
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const head = Object.keys(rows[0]!);
  return [head, ...rows.map((r) => head.map((k) => r[k]))].map((line) => line.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

// data.json plus one CSV per part, for opening in a spreadsheet.
function exportZip(data: AccountExport) {
  return zipSync({
    "data.json": strToU8(JSON.stringify(data, null, 2)),
    "profile.csv": strToU8(toCsv([data.profile])),
    "consents.csv": strToU8(toCsv(data.consents)),
    "bookings.csv": strToU8(toCsv(data.bookings.map(({ location, ...b }) => ({ ...b, location: `${location.name}, ${location.address}` })))),
  });
}

async function assertDeletable(user: SessionUser, now: Date) {
  // Staff rows are referenced by their calendar and bookings; the owner removes a coach.
  if (isStaff(user.role)) throw new ApiError(409, "staff_account", "A coach account can't delete itself");
  const upcoming = await db()
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(own(user), inArray(bookings.status, active), gte(bookings.endAt, now)))
    .limit(1);
  if (upcoming.length) throw new ApiError(409, "upcoming_bookings", "Cancel your upcoming bookings first");
}

// What an anonymised booking keeps, and why, is listed in account.test.ts ("what deletion keeps").
export const anonymised = () => ({
  customerUserId: null,
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  healthAnswers: null,
  healthConsentAt: null,
  utm: null,
  cancelReason: null,
  // The links in old emails stop working.
  manageToken: randomBytes(24).toString("base64url"),
});

// Deletes the user (sessions, sign-in accounts, consents and profile go with it) and anonymises their bookings,
// guest bookings with their email included.
async function deleteAccount(user: SessionUser) {
  const email = user.email.toLowerCase();
  await db().transaction(async (tx) => {
    await tx
      .update(bookings)
      .set(anonymised())
      .where(or(own(user), and(isNull(bookings.customerUserId), eq(bookings.customerEmail, email))));
    await tx.delete(verifications).where(eq(verifications.identifier, deleteIdentifier(user.id)));
    await tx.delete(users).where(eq(users.id, user.id));
  });
}

// The signed-in customer's own data. Every route acts on the session's user only; none takes a user id.
// Only a session is needed (no health data consent), so someone who withdrew it can still export and delete.
export const account = new Hono()
  .get("/bookings", requireSession, validate("query", LocaleQuery), async (c) => {
    const user = c.get("user");
    await claimGuestBookings(user);
    const locale = c.req.valid("query").locale ?? user.locale;
    const now = new Date();
    return c.json<AccountBooking[]>((await findBookings(own(user))).map((r) => accountBooking(r, locale, now)));
  })
  .get("/bookings/:id/calendar", requireSession, validate("param", IdParam), validate("query", LocaleQuery), async (c) => {
    const user = c.get("user");
    const row = await findBooking(c.req.valid("param").id);
    if (row.booking.customerUserId !== user.id) throw new ApiError(404, "not_found", "Booking not found");
    const locale = c.req.valid("query").locale ?? user.locale;
    const ics = icsEvent({
      uid: row.booking.id,
      start: row.booking.startAt,
      end: row.booking.endAt,
      summary: `${serviceName(row.service, locale)}, Jaka Marinko`,
      location: `${row.location.name}, ${row.location.address}`,
      url: `${bookingConfig().siteUrl}/${locale}/account/bookings`,
    });
    return c.body(ics, 200, {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="booking-${row.booking.id.slice(0, 8)}.ics"`,
    });
  })
  .get("/profile", requireSession, async (c) => {
    const { id: _, role: __, createdAt: ___, ...profile } = await profileOf(c.get("user"));
    return c.json<Profile>(profile);
  })
  .put("/profile", requireSession, validate("json", ProfileInput), async (c) => {
    const user = c.get("user");
    const { name, phone, locale } = c.req.valid("json");
    const now = new Date();
    await db().transaction(async (tx) => {
      await tx.update(users).set({ name, locale }).where(eq(users.id, user.id));
      await tx.insert(profiles).values({ userId: user.id, phone }).onConflictDoUpdate({ target: profiles.userId, set: { phone } });
      // Reminders and other emails of upcoming bookings follow the new language.
      await tx
        .update(bookings)
        .set({ locale })
        .where(and(own(user), inArray(bookings.status, active), gt(bookings.startAt, now)));
    });
    const { id: _, role: __, createdAt: ___, ...profile } = await profileOf(user);
    return c.json<Profile>(profile);
  })
  .get("/consents", requireSession, async (c) => c.json<ConsentRecord[]>(await consentHistory(c.get("user").id)))
  .get("/export", requireSession, async (c) => {
    const now = new Date();
    const zip = exportZip(await exportData(c.get("user"), now));
    return c.body(zip, 200, {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="jakamarinko-data-${now.toISOString().slice(0, 10)}.zip"`,
      "cache-control": "no-store",
    });
  })
  // Step 1: email a confirmation link. Nothing is deleted yet.
  .post("/delete", requireSession, async (c) => {
    const user = c.get("user");
    const now = new Date();
    await assertDeletable(user, now);
    const token = randomBytes(32).toString("base64url");
    const identifier = deleteIdentifier(user.id);
    await db().delete(verifications).where(eq(verifications.identifier, identifier));
    await db()
      .insert(verifications)
      .values({ id: randomUUID(), identifier, value: sha256(token), expiresAt: new Date(now.getTime() + deleteLinkMinutes * 60_000) });
    const url = `${bookingConfig().siteUrl}/${user.locale}/account/privacy/delete?token=${token}`;
    const sent = await sendEmail({
      to: user.email,
      locale: user.locale,
      template: "accountDelete",
      props: { url, expiresInMinutes: deleteLinkMinutes },
    });
    if (!sent.ok) throw new ApiError(502, "email_failed", "The confirmation email could not be sent");
    return c.json({ expiresInMinutes: deleteLinkMinutes }, 202);
  })
  // Step 2: the link from the email, opened while signed in as the same user.
  .post("/delete/confirm", requireSession, validate("json", DeleteConfirmInput), async (c) => {
    const user = c.get("user");
    const now = new Date();
    const [link] = await db()
      .select({ id: verifications.id })
      .from(verifications)
      .where(
        and(
          eq(verifications.identifier, deleteIdentifier(user.id)),
          eq(verifications.value, sha256(c.req.valid("json").token)),
          gt(verifications.expiresAt, now),
        ),
      );
    if (!link) throw new ApiError(400, "invalid_token", "The link has expired or isn't yours");
    await assertDeletable(user, now);
    await deleteAccount(user);
    return c.body(null, 204);
  });
