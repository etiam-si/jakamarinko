import type { Locale } from "@jakamarinko/types";
import en from "./messages/en.json";
import slJson from "./messages/sl.json";

export type Messages = typeof en;
// Typed as the English file, so a key missing in Slovenian fails typecheck.
const sl: Messages = slJson;
const messages: Record<Locale, Messages> = { en, sl };

export function messagesFor(locale: Locale): Messages {
  return messages[locale];
}

// Fills {placeholders}. A missing value throws, so "undefined" never reaches an inbox.
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`email text needs {${key}}`);
    return String(value);
  });
}

const intlLocale: Record<Locale, string> = { en: "en-GB", sl: "sl-SI" };
export const timeZone = "Europe/Ljubljana";

// Bookings are always in Slovenia, so times are shown in Ljubljana time whatever the reader's zone.
export function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale[locale], { timeZone, weekday: "long", day: "numeric", month: "long" }).format(date);
}

export function formatTime(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale[locale], { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

export function formatWhen(date: Date, locale: Locale) {
  return `${formatDate(date, locale)}, ${formatTime(date, locale)}`;
}
