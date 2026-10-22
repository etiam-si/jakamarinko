"use client";

import { useLocale } from "next-intl";
import { labTests, type Locale, sessions } from "@jakamarinko/types";
import { dayAsDate, localDate, timeZone } from "./time";

const catalog = [...labTests, ...sessions];

// The service in the coach's language (the booking itself carries the name in the customer's).
export function useServiceName() {
  const locale = useLocale() as Locale;
  return (id: string) => catalog.find((s) => s.id === id)?.name[locale] ?? id;
}

export const services = catalog.map((s) => s.id);

// British English like the emails: "Monday 2 November", 24-hour times.
const intlLocale: Record<Locale, string> = { en: "en-GB", sl: "sl-SI" };

// Times and days in Ljubljana time.
export function useWhen() {
  const locale = intlLocale[useLocale() as Locale];
  const clock = new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const long = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  const brief = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short", day: "numeric", month: "numeric" });
  const time = (iso: string) => clock.format(new Date(iso));
  // A YYYY-MM-DD, e.g. "Monday 2 November".
  const day = (date: string) => long.format(dayAsDate(date));
  const short = (date: string) => brief.format(dayAsDate(date));
  const when = (iso: string) => `${day(localDate(new Date(iso)))}, ${time(iso)}`;
  return { time, day, short, when };
}
