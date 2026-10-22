import type { Metadata } from "next";
import type { useFormatter } from "next-intl";
import type { Locale, ServiceId } from "@jakamarinko/types";
import { locales } from "@jakamarinko/types";
import { z } from "zod";
import { BRAND_NAME } from "@/components/brand/logo";

// Canonical URLs, hreflang, the sitemap and structured data all use this origin. Baked in at build time.
export const siteUrl = z
  .url()
  .default("https://jakamarinko.com")
  .parse(process.env.NEXT_PUBLIC_SITE_URL || undefined)
  .replace(/\/$/, "");

// Public pages in nav order, by path under /[locale]. The sitemap lists these plus the legal pages.
export const pages = ["", "/about", "/coaching", "/lab", "/contact"] as const;
export const legalPages = ["/legal/privacy", "/legal/terms", "/legal/cookies"] as const;

export const url = (locale: Locale | string, path: string) => `${siteUrl}/${locale}${path}`;

// hreflang for every language plus x-default, which goes to English.
export function languages(path: string) {
  return {
    ...Object.fromEntries(locales.map((l) => [l, url(l, path)])),
    "x-default": url("en", path),
  };
}

// Title, description, canonical and hreflang alternates for one page in one language.
export function pageMetadata(locale: string, path: string, meta: { title: string; description: string }): Metadata {
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url(locale, path), languages: languages(path) },
    openGraph: {
      type: "website",
      siteName: BRAND_NAME,
      title: meta.title,
      description: meta.description,
      url: url(locale, path),
      locale: locale === "sl" ? "sl_SI" : "en_GB",
    },
  };
}

// Where every "Book" button goes; T11 builds the page.
export const bookingHref = (service: ServiceId) => ({ pathname: "/booking", query: { service } }) as const;

// Prices are whole euros; cents only appear if a price ever has them.
export const euros = (cents: number) => cents / 100;
// One way to write a price on every page and in both languages: "90 €", "2,290 €" / "2.290 €", with a no-break
// space so the sign never wraps alone. Messages that put the € themselves ("{price} €") get euros() plain.
export const euro = (format: ReturnType<typeof useFormatter>, cents: number) =>
  `${format.number(euros(cents), { maximumFractionDigits: 2 })}\u00a0€`;
export const eurFormat = { style: "currency", currency: "EUR", maximumFractionDigits: 2, minimumFractionDigits: 0 } as const;

// The lab. The same string goes into the structured data (JSON-LD); the maps link is a plain search URL (no embedded
// map: faster, and nothing loads from Google until someone taps it).
export const labAddress = "Spodnje Pirnice 19N";
export const labMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${labAddress}, 1215 Medvode, Slovenia`)}`;

// Dev, e2e and screenshot builds: show the designed placeholders for photos we still need (PhotoSlot) and the sample
// testimonials. Off in production, where every slot falls back to a real photo or the section adapts.
export const showPlaceholders = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true";

export const photos = {
  redBull: "/brand/photos/jaka-redbull-400.png",
  trail: "/brand/photos/jaka-gorski-tek.jpg",
  skimo: "/brand/photos/jaka-turno-smucanje.jpg",
  xcSki: "/brand/photos/jaka-tek-na-smuceh.jpg",
  finish: "/brand/photos/jaka-sp-cilj.jpg",
  europeans: "/brand/photos/jaka-ep-gorski-tek.webp",
} as const;
