import type { MetadataRoute } from "next";
import { locales } from "@jakamarinko/types";
import { languages, legalPages, pages, url } from "@/components/site/site";

// Every public page in both languages, each with its hreflang alternates.
export default function sitemap(): MetadataRoute.Sitemap {
  return [...pages, ...legalPages].flatMap((path) =>
    locales.map((locale) => ({
      url: url(locale, path),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : legalPages.includes(path as (typeof legalPages)[number]) ? 0.3 : 0.8,
      alternates: { languages: languages(path) },
    })),
  );
}
