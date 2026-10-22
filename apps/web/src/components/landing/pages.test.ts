import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { locales } from "@jakamarinko/types";
import { expect, test } from "vitest";
import sitemap from "@/app/sitemap";
import { hardcodedText } from "@/components/site/no-hardcoded-text.test";
import { landingPages, offerItem } from "./pages";

const messagesDir = path.join(__dirname, "../../../messages");
const messages = (locale: string) =>
  Object.fromEntries(
    readdirSync(path.join(messagesDir, locale)).map((f) => [f.replace(/\.json$/, ""), JSON.parse(readFileSync(path.join(messagesDir, locale, f), "utf8"))]),
  );
const lookup = (tree: unknown, key: string) => key.split(".").reduce<any>((node, part) => node?.[part], tree);

test("slugs are unique and url-safe", () => {
  const slugs = landingPages.map((p) => p.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
});

test.each(locales)("every page has all its texts in %s", (locale) => {
  const all = messages(locale);
  for (const page of landingPages) {
    const own = `landing.pages.${page.slug}`;
    const keys = ["meta.title", "meta.description", "hero.eyebrow", "hero.title", "hero.lead", "cta", "close.title", "close.text"];
    for (const point of ["one", "two", "three"]) keys.push(`points.${point}.title`, `points.${point}.text`);
    for (const key of keys) expect(lookup(all, `${own}.${key}`), `${locale} ${own}.${key}`).toEqual(expect.any(String));
    for (const faq of page.faq) {
      expect(lookup(all, `${faq}.question`), `${locale} ${faq}`).toEqual(expect.any(String));
      expect(lookup(all, `${faq}.answer`), `${locale} ${faq}`).toEqual(expect.any(String));
    }
  }
});

test("every offer is in the catalog, with a price and one action", () => {
  for (const page of landingPages) {
    const item = offerItem(page.offer, "en");
    expect(item.priceCents, page.slug).toBeGreaterThan(0);
    expect(item.href).toBeTruthy();
  }
});

test("landing pages stay out of the sitemap", () => {
  expect(sitemap().filter((entry) => entry.url.includes("/lp/"))).toEqual([]);
});

test("no text written straight into the landing components or route", () => {
  const dirs = [__dirname, path.join(__dirname, "../../app/[locale]/(landing)")];
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      return statSync(full).isDirectory() ? files(full) : full.endsWith(".tsx") ? [full] : [];
    });
  for (const file of dirs.flatMap(files)) expect(hardcodedText(readFileSync(file, "utf8")), file).toEqual([]);
});
