import { expect, type Page, test } from "@playwright/test";
import { labTests } from "@jakamarinko/types";
import enAccount from "../messages/en/account.json";
import enCoachBooking from "../messages/en/coach-booking.json";
import enCommon from "../messages/en/common.json";
import enErrors from "../messages/en/errors.json";
import enLegal from "../messages/en/legal.json";
import slCommon from "../messages/sl/common.json";
import slErrors from "../messages/sl/errors.json";
import { landingPages } from "../src/components/landing/pages";
import { serializeConsent } from "../src/lib/consent";

// US-011: speed, finishing touches and SEO. Page set P from docs/plan/tasks/T18-premium-polish.md.
const locales = ["en", "sl"] as const;
const paths = [
  "",
  "/about",
  "/coaching",
  "/lab",
  "/contact",
  "/booking",
  ...landingPages.map((p) => `/lp/${p.slug}`),
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  "/sign-in",
];
const common = { en: enCommon, sl: slCommon };
const errors = { en: enErrors, sl: slErrors };

test.beforeEach(async ({ context, baseURL }) => {
  const value = encodeURIComponent(serializeConsent({ analytics: false, marketing: false }));
  await context.addCookies([{ name: "jm_consent", value, url: baseURL! }]);
});

// The words of a message up to its first placeholder or tag, so it can be looked for in the HTML as is.
const plain = (message: string) => message.split(/[{<]/)[0]!.trim();

test.describe("per-page messages", () => {
  // One string each from namespaces only the coach area, the account and the legal pages use.
  const foreign = [
    plain(enCoachBooking.noCalendar.body),
    plain(enAccount.profile.emailHint),
    plain(enLegal.privacy.sections.controller.body[1]!),
  ];

  for (const path of ["/en", "/en/lab"]) {
    test(`${path} ships no coach, account or legal messages`, async ({ request }) => {
      const html = await (await request.get(path)).text();
      for (const text of foreign) {
        expect(text.length).toBeGreaterThan(20);
        expect(html).not.toContain(text);
      }
      // ...while the page's own texts are there.
      expect(html).toContain(enCommon.nav.lab);
    });
  }

  test("no page in P is missing a message its client components need", async ({ page }) => {
    // Every page in both languages, each until its scripts have run.
    test.setTimeout(180_000);
    const missing: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" && /MISSING_MESSAGE|INSUFFICIENT_PATH/.test(m.text())) missing.push(`${page.url()}: ${m.text()}`);
    });
    for (const locale of locales) {
      for (const path of paths) {
        await page.goto(`/${locale}${path}`);
        await page.waitForLoadState("networkidle");
      }
    }
    expect(missing).toEqual([]);
  });
});

test.describe("404", () => {
  for (const locale of locales) {
    test(`/${locale}/does-not-exist is a designed 404 with a way back`, async ({ page }) => {
      const res = await page.goto(`/${locale}/does-not-exist`);
      expect(res!.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1, name: errors[locale].notFound.title })).toBeVisible();
      await expect(page.getByRole("main").getByRole("link", { name: common[locale].actions.bookTest })).toHaveAttribute(
        "href",
        `/${locale}/booking`,
      );
      const links = page.getByRole("navigation", { name: errors[locale].notFound.linksLabel });
      for (const [key, href] of [
        ["home", `/${locale}`],
        ["lab", `/${locale}/lab`],
        ["contact", `/${locale}/contact`],
      ] as const) {
        await expect(links.getByRole("link", { name: common[locale].nav[key], exact: true })).toHaveAttribute("href", href);
      }
      await expect(page).toHaveTitle(/\S/);
    });
  }

  test("a deeper unknown path and an unknown landing page are 404 too", async ({ request }) => {
    expect((await request.get("/sl/nope/deeper")).status()).toBe(404);
    expect((await request.get("/en/lp/nope")).status()).toBe(404);
  });
});

// Width and height from a PNG's IHDR chunk.
const pngSize = (body: Buffer) => ({ width: body.readUInt32BE(16), height: body.readUInt32BE(20) });

test.describe("link previews", () => {
  test("every page in P has Open Graph and X tags with its own 1200×630 image, and a unique title", async ({ page, request, baseURL }) => {
    test.setTimeout(180_000);
    const titles = new Map<string, string>();
    const images = new Set<string>();
    for (const locale of locales) {
      for (const path of paths) {
        const url = `/${locale}${path}`;
        await page.goto(url);
        const meta = (property: string) => page.locator(`meta[property="${property}"], meta[name="${property}"]`).first();
        await expect(meta("og:title"), url).toHaveAttribute("content", /\S/);
        await expect(meta("og:description"), url).toHaveAttribute("content", /\S/);
        await expect(meta("twitter:card"), url).toHaveAttribute("content", "summary_large_image");
        await expect(meta("twitter:image"), url).toHaveAttribute("content", /^https:\/\//);
        const image = (await meta("og:image").getAttribute("content"))!;
        expect(image, url).toMatch(/^https:\/\/[^/]+\/og\/(en|sl)\/[a-z-]+\.png$/);
        images.add(image);

        const title = await page.title();
        expect(titles.get(title), `${url} has the same title as ${titles.get(title)}`).toBeUndefined();
        titles.set(title, url);
      }
    }
    // The absolute URL points at the production origin; the same path is served here.
    for (const image of images) {
      const res = await request.get(new URL(new URL(image).pathname, baseURL).toString());
      expect(res.status(), image).toBe(200);
      expect(res.headers()["content-type"], image).toMatch(/^image\/(png|jpeg)/);
      expect(pngSize(await res.body()), image).toEqual({ width: 1200, height: 630 });
    }
  });
});

type Node = Record<string, unknown> & { "@type"?: string };
async function jsonLd(page: Page): Promise<Node[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((text) => {
    const json = JSON.parse(text) as Node & { "@graph"?: Node[] };
    return json["@graph"] ?? [json];
  });
}

test.describe("structured data", () => {
  test("/en names Jaka as a Person and the business", async ({ page }) => {
    await page.goto("/en");
    const types = (await jsonLd(page)).map((n) => n["@type"]);
    expect(types).toContain("Person");
    expect(types.some((t) => t === "LocalBusiness" || t === "SportsActivityLocation")).toBe(true);
  });

  for (const locale of locales) {
    test(`/${locale}/lab lists every lab test with its catalog price in EUR`, async ({ page }) => {
      await page.goto(`/${locale}/lab`);
      const services = (await jsonLd(page)).filter((n) => n["@type"] === "Service");
      for (const test of labTests) {
        const service = services.find((s) => s.name === test.name[locale]);
        expect(service, test.id).toBeDefined();
        const offer = service!.offers as { price: string; priceCurrency: string };
        expect(Number(offer.price), test.id).toBe(test.priceCents / 100);
        expect(offer.priceCurrency).toBe("EUR");
      }
    });
  }

  // Every page in P: the FAQPage questions are exactly the questions shown (the FAQ is <details> rows), and a page
  // without a FAQ has no FAQPage. The coaching page and every landing page with a faq block must have one.
  const mustHaveFaq = ["/coaching", ...landingPages.filter((p) => p.blocks.includes("faq")).map((p) => `/lp/${p.slug}`)];
  for (const locale of locales) {
    test(`/${locale}: FAQPage questions are exactly the FAQ on the page`, async ({ page }) => {
      test.setTimeout(120_000);
      for (const path of paths) {
        await page.goto(`/${locale}${path}`);
        const faq = (await jsonLd(page)).filter((n) => n["@type"] === "FAQPage");
        const questions = faq.flatMap((f) => (f.mainEntity as { name: string }[]).map((q) => q.name));
        const visible = (await page.locator("main details > summary").allInnerTexts()).map((t) => t.trim());
        expect(questions, path).toEqual(visible);
        expect(faq.length, path).toBeLessThanOrEqual(1);
        if (mustHaveFaq.includes(path)) expect(questions.length, path).toBeGreaterThan(0);
      }
    });
  }
});

test.describe("icons", () => {
  test("favicon, apple-touch-icon, manifest and theme colour", async ({ page, request }) => {
    expect((await request.get("/favicon.ico")).status()).toBe(200);
    const apple = await request.get("/apple-touch-icon.png");
    expect(apple.status()).toBe(200);
    expect(pngSize(await apple.body())).toEqual({ width: 180, height: 180 });

    await page.goto("/en");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", /^#[0-9a-f]{6}$/i);
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    const res = await request.get(href!);
    expect(res.status()).toBe(200);
    const manifest = (await res.json()) as { name: string; short_name: string; icons: { src: string; sizes: string }[] };
    expect(manifest.name).toMatch(/\S/);
    expect(manifest.short_name).toMatch(/\S/);
    for (const size of ["192x192", "512x512"]) {
      const icon = manifest.icons.find((i) => i.sizes === size);
      expect(icon, size).toBeDefined();
      expect((await request.get(icon!.src)).status(), size).toBe(200);
    }
  });
});
