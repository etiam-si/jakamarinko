import { expect, type Page, test } from "@playwright/test";
import { labTests, sessions } from "@jakamarinko/types";
import enCommon from "../messages/en/common.json";
import slCommon from "../messages/sl/common.json";
import enCoaching from "../messages/en/coaching.json";
import enLab from "../messages/en/lab.json";
import slCoaching from "../messages/sl/coaching.json";
import slLab from "../messages/sl/lab.json";

const common = { en: enCommon, sl: slCommon } as const;
// The entry offer (conversion playbook): these buttons all open the booking with the lactate profile.
const lactateCtas = {
  en: [enLab.hero.primaryCta, enLab.close.button, enCoaching.hero.secondaryCta],
  sl: [slLab.hero.primaryCta, slLab.close.button, slCoaching.hero.secondaryCta],
} as const;
const pages = [
  { path: "/about", key: "about" },
  { path: "/coaching", key: "coaching" },
  { path: "/lab", key: "lab" },
  { path: "/contact", key: "contact" },
] as const;
const bookable = [...labTests, ...sessions];

// Without a consent choice the banner covers the bottom of the page; these tests are about the site, not the banner.
test.beforeEach(async ({ context, baseURL }) => {
  const value = encodeURIComponent(JSON.stringify({ v: 1, analytics: false, marketing: false }));
  await context.addCookies([{ name: "jm_consent", value, url: baseURL! }]);
});

const mainNav = (page: Page, locale: "en" | "sl") => page.getByRole("navigation", { name: common[locale].nav.label });

for (const locale of ["en", "sl"] as const) {
  test.describe(locale, () => {
    test("every nav link works", async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      for (const { path, key } of pages) {
        await mainNav(page, locale).getByRole("link", { name: common[locale].nav[key] }).click();
        await expect(page).toHaveURL(`/${locale}${path}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(mainNav(page, locale).getByRole("link", { name: common[locale].nav[key] })).toHaveAttribute("aria-current", "page");
      }
      await page.getByRole("link", { name: common[locale].nav.home }).click();
      await expect(page).toHaveURL(`/${locale}`);
    });

    test("every nav link works from the phone menu", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      for (const { path, key } of pages) {
        await page.goto(`/${locale}`);
        await page.getByRole("button", { name: common[locale].nav.openMenu }).click();
        await page.getByRole("dialog").getByRole("link", { name: common[locale].nav[key] }).click();
        await expect(page).toHaveURL(`/${locale}${path}`);
        await expect(page.getByRole("dialog")).toBeHidden();
      }
    });

    test("every page has a title, a description, a canonical URL and hreflang alternates", async ({ page }) => {
      for (const path of ["", ...pages.map((p) => p.path)]) {
        await page.goto(`/${locale}${path}`);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S/);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://jakamarinko.com/${locale}${path}`);
        for (const lang of ["en", "sl"]) {
          await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveAttribute("href", `https://jakamarinko.com/${lang}${path}`);
        }
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
      }
    });

    // "Book a test" (header, footer) opens the booking at its first step; the entry-offer buttons ("Book a lactate
    // test") open it with the lactate profile; every other Book button names one service and opens the booking with it.
    test("every Book button goes to /booking with the right service", async ({ page }) => {
      const prefix = common[locale].actions.bookItem.replace("{name}", "");
      let checked = 0;
      for (const path of ["/lab", "/coaching"]) {
        await page.goto(`/${locale}${path}`);
        const links = page.locator('a[href*="/booking"]');
        for (const link of await links.all()) {
          const text = (await link.textContent())!.trim();
          if (text === common[locale].actions.bookTest) {
            await expect(link).toHaveAttribute("href", `/${locale}/booking`);
            continue;
          }
          if ((lactateCtas[locale] as readonly string[]).includes(text)) {
            await expect(link).toHaveAttribute("href", `/${locale}/booking?service=lactate-profile`);
            continue;
          }
          const name = (await link.textContent())!.replace(prefix, "");
          const service = bookable.find((s) => s.name[locale] === name);
          expect(service, name).toBeDefined();
          await expect(link).toHaveAttribute("href", `/${locale}/booking?service=${service!.id}`);
          checked++;
        }
      }
      // Every lab test and the personal training session.
      expect(checked).toBe(bookable.length);
    });
  });
}

test("the language switch keeps the page", async ({ page }) => {
  for (const { path } of pages) {
    await page.goto(`/en${path}`);
    await page.getByRole("link", { name: "Slovenščina" }).click();
    await expect(page).toHaveURL(`/sl${path}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "sl");
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(`/en${path}`);
  }
});

test("the footer links to the legal pages and reopens the cookie settings", async ({ page }) => {
  await page.goto("/en");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Strava" })).toHaveAttribute("href", /strava\.com\/athletes\//);
  for (const [name, path] of [["Privacy policy", "privacy"], ["Terms", "terms"], ["Cookie policy", "cookies"]]) {
    await expect(footer.getByRole("link", { name })).toHaveAttribute("href", `/en/legal/${path}`);
  }
  await footer.getByRole("button", { name: "Cookie settings" }).click();
  await expect(page.getByRole("dialog", { name: "Cookie settings" })).toBeVisible();
});

test("the sitemap lists every page in both languages with hreflang", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const path of ["", ...pages.map((p) => p.path), "/legal/privacy", "/legal/terms", "/legal/cookies"]) {
    for (const locale of ["en", "sl"]) {
      expect(xml).toContain(`<loc>https://jakamarinko.com/${locale}${path}</loc>`);
      expect(xml).toContain(`hreflang="${locale}" href="https://jakamarinko.com/${locale}${path}"`);
    }
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: https://jakamarinko.com/sitemap.xml");
  expect(robots).not.toMatch(/Disallow: \/en\/coach\s*$/m);
});

test("no page shows a missing message or the qualifications placeholder", async ({ page }) => {
  for (const locale of ["en", "sl"]) {
    for (const path of ["", ...pages.map((p) => p.path)]) {
      await page.goto(`/${locale}${path}`);
      await expect(page.locator("body")).not.toContainText(/TODO|\{\w+\}|\b(home|about|coaching|lab|common|site)\.\w+\.\w+/);
    }
  }
});
