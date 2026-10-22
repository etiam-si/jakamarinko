import { defaultLocale, locales, type Locale } from "@jakamarinko/types";

type Context = {
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Headers;
  request?: Request;
} | null;

const isLocale = (value: unknown): value is Locale => locales.includes(value as Locale);

// The language a sign-in came from: the callback URL's /en or /sl prefix (it travels inside the magic link,
// so it also works in another browser), else the NEXT_LOCALE cookie (Google), else English.
export function localeFromContext(ctx: Context | undefined): Locale {
  const body = ctx?.body && typeof ctx.body === "object" ? (ctx.body as Record<string, unknown>) : {};
  for (const url of [ctx?.query?.callbackURL, body.callbackURL]) {
    if (typeof url !== "string") continue;
    const first = new URL(url, "http://x").pathname.split("/")[1];
    if (isLocale(first)) return first;
  }
  const cookie = (ctx?.headers ?? ctx?.request?.headers)?.get("cookie") ?? "";
  const fromCookie = /(?:^|;\s*)NEXT_LOCALE=([^;]+)/.exec(cookie)?.[1];
  return isLocale(fromCookie) ? fromCookie : defaultLocale;
}
