import { and, eq, isNull } from "drizzle-orm";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import type { TrackEvent } from "@jakamarinko/api";
import { db } from "@jakamarinko/db";
import { bookings, type ConversionClient, conversions, offerRedemptions, requests, serviceTypes } from "@jakamarinko/db/schema";
import { reportConversion } from "./meta";

// The cookie banner's choice (apps/web/src/lib/consent.ts). If web bumps its version and this doesn't follow,
// every visitor counts as not consented: nothing is sent, which is the safe way to be wrong.
const CONSENT_VERSION = 1;
const ConsentCookie = z.object({ v: z.literal(CONSENT_VERSION), marketing: z.boolean() });

function marketingConsent(c: Context) {
  try {
    return ConsentCookie.safeParse(JSON.parse(getCookie(c, "jm_consent") ?? "")).data?.marketing === true;
  } catch {
    return false;
  }
}

// What Meta matches a visitor by, read from the request that booked or wrote. Only with marketing consent.
// The IP only behind Cloudflare (production); the pixel's own cookies _fbp and _fbc when it set them.
function clientOf(c: Context): ConversionClient {
  const text = (value: string | undefined) => value?.slice(0, 500) || undefined;
  return {
    userAgent: text(c.req.header("user-agent")),
    ip: text(c.req.header("cf-connecting-ip")),
    fbp: text(getCookie(c, "_fbp")),
    fbc: text(getCookie(c, "_fbc")),
    sourceUrl: text(c.req.header("referer")),
  };
}

// Also the browser's pixel event id (track() in web), so Meta deduplicates the two.
export const conversionEventId = (name: TrackEvent, id: string) => `${name}-${id}`;

type Subject = { bookingId: string } | { requestId: string };

// Notes the visitor's consent with the booking or request, when they act. Returns the event id.
export async function recordConversion(c: Context, name: TrackEvent, subject: Subject) {
  const consent = marketingConsent(c);
  const eventId = conversionEventId(name, "bookingId" in subject ? subject.bookingId : subject.requestId);
  await db()
    .insert(conversions)
    .values({ eventId, name, ...subject, marketingConsent: consent, client: consent ? clientOf(c) : null })
    .onConflictDoNothing();
  return eventId;
}

async function details(row: typeof conversions.$inferSelect) {
  if (row.bookingId) {
    const [b] = await db()
      .select({
        email: bookings.customerEmail,
        utm: bookings.utm,
        createdAt: bookings.createdAt,
        priceCents: serviceTypes.priceCents,
        paidCents: offerRedemptions.paidCents,
      })
      .from(bookings)
      .innerJoin(serviceTypes, eq(serviceTypes.id, bookings.serviceTypeId))
      .leftJoin(offerRedemptions, eq(offerRedemptions.bookingId, bookings.id))
      .where(eq(bookings.id, row.bookingId));
    if (!b) return null;
    // Meta's click id from the ad link, when the pixel hadn't stored it as _fbc yet.
    const fbclid = b.utm?.fbclid;
    const fbc = row.client?.fbc ?? (fbclid ? `fb.1.${b.createdAt.getTime()}.${fbclid}` : undefined);
    return { email: b.email, // The price actually paid, after an offer code or discount.
      value: (b.paidCents ?? b.priceCents) / 100, currency: "EUR", client: row.client && { ...row.client, fbc } };
  }
  if (row.requestId) {
    const [r] = await db().select({ email: requests.email }).from(requests).where(eq(requests.id, row.requestId));
    return r ? { email: r.email, client: row.client } : null;
  }
  return null;
}

// Sends a recorded conversion to Meta, once: a second call (a replayed webhook) finds it claimed and does nothing.
// Afterwards the device details are deleted; only the outcome stays. Never throws, so the booking or message that
// triggered it still succeeds.
export async function reportRecorded(eventId: string) {
  try {
    const [row] = await db()
      .update(conversions)
      .set({ reportedAt: new Date() })
      .where(and(eq(conversions.eventId, eventId), isNull(conversions.reportedAt)))
      .returning();
    if (!row) return;
    const found = await details(row);
    const status = found
      ? await reportConversion({ name: row.name as TrackEvent, eventId, marketingConsent: row.marketingConsent, ...found })
      : "failed";
    await db().update(conversions).set({ status, client: null }).where(eq(conversions.eventId, eventId));
  } catch {
    console.warn(`conversions: could not report ${eventId}`);
  }
}

// For T13's webhook (and confirmed bookings today): the booking is paid, report its Purchase.
export const reportBookingPaid = (bookingId: string) => reportRecorded(conversionEventId("booking_paid", bookingId));
