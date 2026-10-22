import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "@jakamarinko/types";

// Every page lives under /en or /sl. A visitor without a cookie gets the language their browser asks for
// (Slovenian → sl, anything else → en); the language they pick is kept in the NEXT_LOCALE cookie for a year.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});
