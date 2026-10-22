import type { AccountBooking } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";

const intl: Record<Locale, string> = { en: "en-GB", sl: "sl-SI" };
// Bookings are in Slovenia, so times are Ljubljana time wherever the reader is.
const timeZone = "Europe/Ljubljana";

export const formatDay = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(intl[locale], { timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export const formatShortDay = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(intl[locale], { timeZone, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export const formatTime = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(intl[locale], { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

// "in 3 days", "in 5 hours", "čez 40 minut": the largest unit that is at least 1, hours up to two days.
export function startsIn(iso: string, now: Date, locale: Locale) {
  const minutes = Math.max(0, Math.round((new Date(iso).getTime() - now.getTime()) / 60_000));
  const format = new Intl.RelativeTimeFormat(intl[locale], { numeric: "auto" });
  if (minutes < 60) return format.format(minutes, "minute");
  if (minutes < 48 * 60) return format.format(Math.round(minutes / 60), "hour");
  return format.format(Math.round(minutes / (24 * 60)), "day");
}

const active = (b: AccountBooking) => b.status === "confirmed" || b.status === "pending_payment";

// Upcoming: still active and not started. Everything else is past (or cancelled), newest first.
export function splitBookings(bookings: AccountBooking[], now: Date) {
  const upcoming = bookings.filter((b) => active(b) && new Date(b.start) > now);
  const past = bookings.filter((b) => !upcoming.includes(b)).reverse();
  return { upcoming, past };
}

export const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

// Through this site's /api, so the session cookie goes along.
export const calendarUrl = (id: string, locale: Locale) => `/api/account/bookings/${id}/calendar?locale=${locale}`;
