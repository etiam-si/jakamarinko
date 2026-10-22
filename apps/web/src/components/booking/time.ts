import type { Locale } from "@jakamarinko/types";

// Bookings are in Slovenia, so every time is shown in Ljubljana time, whatever the visitor's own zone.
// Same formats as the emails (packages/email/src/i18n.ts), so the page and the email read the same.
export const timeZone = "Europe/Ljubljana";
const intlLocale: Record<Locale, string> = { en: "en-GB", sl: "sl-SI" };

export const formatDate = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale[locale], { timeZone, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));

export const formatTime = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale[locale], { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

export const formatWhen = (iso: string, locale: Locale) => `${formatDate(iso, locale)}, ${formatTime(iso, locale)}`;

// The Ljubljana calendar date of an instant, YYYY-MM-DD.
export const localDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);

export function addDays(day: string, days: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Slots grouped by their Ljubljana date, in order. One entry per start time (the first coach free then).
export function slotsByDay<S extends { start: string }>(slots: S[]) {
  const days = new Map<string, S[]>();
  for (const slot of [...slots].sort((a, b) => a.start.localeCompare(b.start))) {
    const day = localDay(new Date(slot.start));
    const list = days.get(day) ?? [];
    if (!list.some((s) => s.start === slot.start)) list.push(slot);
    days.set(day, list);
  }
  return days;
}

// A day from the list, short: "Mon 26 Oct" / "pon., 26. okt.".
export const formatDay = (day: string, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale[locale], { timeZone, weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${day}T12:00:00Z`),
  );

// The same day in two lines for a day tile: "Mon" over "26 Oct" / "pon." over "26. okt.".
export const dayParts = (day: string, locale: Locale) => {
  const date = new Date(`${day}T12:00:00Z`);
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intlLocale[locale], { timeZone, ...options }).format(date);
  return { weekday: part({ weekday: "short" }), date: part({ day: "numeric", month: "short" }) };
};
