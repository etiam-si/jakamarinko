import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { ConversionReport, ConversionReportQuery } from "@jakamarinko/api";
import { db } from "@jakamarinko/db";
import { bookings, serviceTypes } from "@jakamarinko/db/schema";
import { addDays, zoned } from "../booking/time";

// Bookings that count: not cancelled and not waiting for payment.
const counted = ["confirmed", "completed", "no_show"] as const;

// Bookings and revenue per utm_source and utm_campaign, for bookings made between from and to (Ljubljana dates).
// Revenue is the service's price; once payments (T13) store the amount paid, that is the better number.
export async function conversionReport({ from, to }: ConversionReportQuery): Promise<ConversionReport> {
  const source = sql<string | null>`${bookings.utm}->>'utm_source'`;
  const campaign = sql<string | null>`${bookings.utm}->>'utm_campaign'`;
  const revenue = sql<number>`coalesce(sum(${serviceTypes.priceCents}), 0)::int`;
  const rows = await db()
    .select({ source, campaign, bookings: sql<number>`count(*)::int`, revenueCents: revenue })
    .from(bookings)
    .innerJoin(serviceTypes, eq(serviceTypes.id, bookings.serviceTypeId))
    .where(
      and(
        inArray(bookings.status, [...counted]),
        gte(bookings.createdAt, zoned(from, 0)),
        lt(bookings.createdAt, zoned(addDays(to, 1), 0)),
      ),
    )
    .groupBy(source, campaign)
    .orderBy(desc(revenue), source, campaign);
  const total = rows.reduce((sum, r) => ({ bookings: sum.bookings + r.bookings, revenueCents: sum.revenueCents + r.revenueCents }), {
    bookings: 0,
    revenueCents: 0,
  });
  return { rows, total };
}
