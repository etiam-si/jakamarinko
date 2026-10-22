import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type Browser, type BrowserContext, expect, type Page, test } from "@playwright/test";
import { labTests, separatePrice } from "@jakamarinko/types";
import { landingPages } from "../src/components/landing/pages";
import { serializeConsent } from "../src/lib/consent";
import enCoaching from "../messages/en/coaching.json";
import enContact from "../messages/en/contact.json";
import enHome from "../messages/en/home.json";
import enLab from "../messages/en/lab.json";
import enLanding from "../messages/en/landing.json";
import slCoaching from "../messages/sl/coaching.json";
import slContact from "../messages/sl/contact.json";
import slHome from "../messages/sl/home.json";
import slLab from "../messages/sl/lab.json";
import slLanding from "../messages/sl/landing.json";

// T18 PRD (docs/plan/tasks/T18-premium-polish.md), the public-site half: US-005 mobile quality, US-007 motion,
// US-009 no heavy dependency, US-010 conversion. The header, sign-in, account and booking have their own spec
// (polish-header.spec.ts), so element checks here look at the page body (main) and the footer.

const locales = ["en", "sl"] as const;
type Locale = (typeof locales)[number];
const widths = [320, 360, 375, 390, 414, 430, 768, 1024, 1440];
const sitePages = ["", "/about", "/coaching", "/lab", "/contact"];
const lpPages = landingPages.map((p) => `/lp/${p.slug}`);
const legalPages = ["/legal/privacy", "/legal/terms", "/legal/cookies"];
const pages = [...sitePages, ...lpPages, ...legalPages];
const nonLegal = [...sitePages, ...lpPages];
const showPlaceholders = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true";

const consentCookie = (baseURL: string) => ({
  name: "jm_consent",
  value: encodeURIComponent(serializeConsent({ analytics: false, marketing: false })),
  url: baseURL,
});

async function open(
  browser: Browser,
  baseURL: string,
  options: { width: number; height?: number; motion?: "reduce" | "no-preference"; banner?: boolean; dpr?: number; touch?: boolean },
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height ?? (options.width < 700 ? 844 : 900) },
    deviceScaleFactor: options.dpr ?? 1,
    hasTouch: options.touch ?? false,
    isMobile: false,
    reducedMotion: options.motion ?? "reduce",
  });
  if (!options.banner) await context.addCookies([consentCookie(baseURL)]);
  return { context, page: await context.newPage() };
}

// Scroll to the bottom in steps (loads lazy images, runs reveals and count-ups), then back to the top.
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(window.innerHeight * 0.6)) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 150));
  });
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

test.describe("US-005 mobile quality", () => {
  for (const locale of locales) {
    for (const p of pages) {
      test(`no horizontal scroll at any width: /${locale}${p}`, async ({ browser, baseURL }) => {
        test.slow();
        const { context, page } = await open(browser, baseURL!, { width: widths[0]! });
        for (const width of widths) {
          await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
          await page.goto(`/${locale}${p}`);
          expect(await overflow(page), `${width} px after load`).toBeLessThanOrEqual(0);
          await scrollThrough(page);
          expect(await overflow(page), `${width} px after scrolling`).toBeLessThanOrEqual(0);
        }
        await context.close();
      });
    }
  }

  for (const p of pages) {
    test(`tap targets are at least 44 × 44 at 320, 375 and 390 px: /en${p}`, async ({ browser, baseURL }) => {
      const { context, page } = await open(browser, baseURL!, { width: 320 });
      for (const width of [320, 375, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(`/en${p}`);
        const small = await page.evaluate(() => {
          const selector = "a, button, input, select, textarea, [role=button]";
          // Links inside running text (a paragraph or a list item with more words around them) are exempt.
          const inText = (el: Element) => {
            if (el.tagName !== "A" || !el.parentElement) return false;
            if (el.closest("p a, li > p a")) return true;
            const block = el.parentElement.closest("p, li");
            return !!block && (block.textContent ?? "").trim().length > (el.textContent ?? "").trim().length + 10;
          };
          return [...document.querySelectorAll<HTMLElement>(`main :is(${selector}), footer :is(${selector})`)]
            .filter((el) => {
              const box = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              if (box.width === 0 || box.height === 0 || style.visibility === "hidden" || style.display === "none") return false;
              if (el.closest("[inert], [aria-hidden=true]") || inText(el)) return false;
              return box.width < 43.5 || box.height < 43.5;
            })
            .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 40)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`);
        });
        expect(small, `${width} px`).toEqual([]);
      }
      await context.close();
    });
  }

  for (const p of pages) {
    test(`inputs are 16 px or larger, and no text under 12 px, at 390: /sl${p}`, async ({ browser, baseURL }) => {
      const { context, page } = await open(browser, baseURL!, { width: 390 });
      await page.goto(`/sl${p}`);
      const inputs = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("input:not([type=hidden]):not([aria-hidden=true]), select, textarea")]
          .filter((el) => el.getBoundingClientRect().width > 0 && getComputedStyle(el).opacity !== "0")
          .map((el) => parseFloat(getComputedStyle(el).fontSize)),
      );
      for (const size of inputs) expect(size).toBeGreaterThanOrEqual(16);
      const tiny = await page.evaluate(() => {
        const found: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const text = walker.currentNode.textContent?.trim();
          const el = walker.currentNode.parentElement;
          if (!text || !el || el.closest("script, style, noscript, .sr-only, [hidden]")) continue;
          const box = el.getBoundingClientRect();
          if (box.width <= 1 || box.height <= 1 || getComputedStyle(el).visibility === "hidden") continue;
          const size = parseFloat(getComputedStyle(el).fontSize);
          if (size < 12) found.push(`${size}px "${text.slice(0, 30)}"`);
        }
        return found;
      });
      expect(tiny).toEqual([]);
      await context.close();
    });
  }

  for (const locale of locales) {
    for (const p of pages) {
      test(`axe finds nothing at 390 and 1440 px, banner open and dismissed: /${locale}${p}`, async ({ browser, baseURL }) => {
        test.slow();
        for (const width of [390, 1440]) {
          for (const banner of [true, false]) {
            const { context, page } = await open(browser, baseURL!, { width, banner });
            await page.goto(`/${locale}${p}`);
            await scrollThrough(page);
            const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
            expect(
              violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
              `${width} px, banner ${banner ? "open" : "dismissed"}`,
            ).toEqual([]);
            await context.close();
          }
        }
      });
    }
  }

  for (const p of pages) {
    test(`no console errors while loading and scrolling at 390 and 1440 px: /en${p}`, async ({ browser, baseURL }) => {
      for (const width of [390, 1440]) {
        const { context, page } = await open(browser, baseURL!, { width });
        const errors: string[] = [];
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`/en${p}`);
        await scrollThrough(page);
        expect(errors, `${width} px`).toEqual([]);
        await context.close();
      }
    });
  }

  for (const p of pages) {
    test(`photos are sharp on a 3× phone: /en${p}`, async ({ browser, baseURL }) => {
      const { context, page } = await open(browser, baseURL!, { width: 390, dpr: 3 });
      await page.goto(`/en${p}`);
      await scrollThrough(page);
      // naturalWidth of a srcset image is density-corrected, so measure the file the browser picked on its own.
      const blurry = await page.evaluate(async () => {
        const found: string[] = [];
        for (const img of [...document.images]) {
          const width = img.getBoundingClientRect().width;
          if (!img.currentSrc || img.currentSrc.endsWith(".svg") || width === 0) continue;
          const file = new Image();
          file.src = img.currentSrc;
          await file.decode();
          if (file.naturalWidth < width * 2) found.push(`${img.alt}: ${file.naturalWidth} px for ${Math.round(width)} px`);
        }
        return found;
      });
      expect(blurry).toEqual([]);
      await context.close();
    });
  }
});

test.describe("US-007 motion", () => {
  for (const width of [390, 1440]) {
    test(`motion: sections below the fold reveal on scroll on /en at ${width} px`, async ({ browser, baseURL }) => {
      const { context, page } = await open(browser, baseURL!, { width, motion: "no-preference" });
      await page.goto("/en");
      // The reveal script hides what is below the fold once the page is interactive.
      await expect(page.locator('[data-reveal="pending"]').first()).toBeAttached();
      const below = page.locator("main section").filter({ has: page.locator("*") });
      const states = await below.evaluateAll((sections) =>
        sections
          .filter((s) => s.getBoundingClientRect().top > window.innerHeight)
          .map((s) => ({ reveal: s.hasAttribute("data-reveal"), opacity: getComputedStyle(s).opacity, transform: getComputedStyle(s).transform })),
      );
      expect(states.length).toBeGreaterThan(2);
      for (const s of states) expect(s.reveal).toBe(true);
      expect(states.some((s) => Number(s.opacity) < 1 || s.transform !== "none")).toBe(true);
      const count = await below.count();
      for (let i = 0; i < count; i++) {
        const section = below.nth(i);
        if (!(await section.getAttribute("data-reveal"))) continue;
        await section.scrollIntoViewIfNeeded();
        await expect.poll(() => section.evaluate((s) => getComputedStyle(s).opacity), { timeout: 1000 }).toBe("1");
      }
      await context.close();
    });
  }

  for (const locale of locales) {
    for (const p of pages) {
      test(`reduced motion: nothing moves on /${locale}${p}`, async ({ browser, baseURL }) => {
        const { context, page } = await open(browser, baseURL!, { width: 390, motion: "reduce" });
        await page.goto(`/${locale}${p}`);
        const reveal = await page.locator("[data-reveal]").evaluateAll((els) =>
          els.map((el) => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform })),
        );
        for (const r of reveal) expect(r).toEqual({ opacity: "1", transform: "none" });
        await page.waitForTimeout(500);
        expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length)).toBe(0);
        await context.close();
      });
    }
  }

  test("stats: count-ups end on the exact numbers, and show them at once with reduced motion", async ({ browser, baseURL }) => {
    const values = Object.values(enHome.proof)
      .filter((v): v is { value: string; label: string } => typeof v === "object")
      .map((v) => v.value);
    for (const motion of ["no-preference", "reduce"] as const) {
      const { context, page } = await open(browser, baseURL!, { width: 390, motion });
      await page.goto("/en");
      const stats = page.locator("[data-proof] [data-count-up]");
      await expect(stats).toHaveCount(values.length);
      if (motion === "reduce") {
        expect(await stats.allTextContents()).toEqual(values);
      } else {
        // Below the fold they start at 0 once the page is interactive, then count to the exact value once seen.
        await expect(stats.first()).toHaveText("0");
        await stats.first().scrollIntoViewIfNeeded();
        await stats.last().scrollIntoViewIfNeeded();
        await expect.poll(() => stats.allTextContents(), { timeout: 4000 }).toEqual(values);
      }
      await context.close();
    }
  });

  test("cards: product cards lift on hover, press or focus on touch, and hide nothing behind hover", async ({ browser, baseURL }) => {
    {
      const { context, page } = await open(browser, baseURL!, { width: 1440, motion: "no-preference" });
      await page.goto("/en/lab");
      const card = page.locator("[data-card]").first();
      await card.scrollIntoViewIfNeeded();
      await expect(card.getByRole("link")).toBeVisible();
      const before = await card.evaluate((el) => `${getComputedStyle(el).transform} ${getComputedStyle(el).boxShadow}`);
      await card.hover();
      await page.waitForTimeout(300);
      const after = await card.evaluate((el) => `${getComputedStyle(el).transform} ${getComputedStyle(el).boxShadow}`);
      expect(after).not.toBe(before);
      await context.close();
    }
    {
      const { context, page } = await open(browser, baseURL!, { width: 390, touch: true });
      await page.goto("/en/coaching");
      const card = page.locator("[data-card]").first();
      await card.scrollIntoViewIfNeeded();
      // A press style for touch (the lift utility's :active), and a visible focus ring on the card's action.
      const hasActive = await page.evaluate(() =>
        [...document.styleSheets].some((sheet) => {
          try {
            return [...sheet.cssRules].some((rule) => rule.cssText.includes(".lift:active"));
          } catch {
            return false;
          }
        }),
      );
      expect(hasActive).toBe(true);
      const action = card.getByRole("link");
      await expect(action).toBeVisible();
      await page.keyboard.press("Tab");
      await action.focus();
      expect(await action.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
      await context.close();
    }
  });

  test("hero: the h1 is visible within 1.5 s of load at 390 px", async ({ browser, baseURL }) => {
    const { context, page } = await open(browser, baseURL!, { width: 390, motion: "no-preference" });
    await page.goto("/en", { waitUntil: "load" });
    const h1 = page.getByRole("heading", { level: 1 });
    await expect.poll(() => h1.evaluate((el) => getComputedStyle(el).opacity), { timeout: 1500 }).toBe("1");
    await expect(h1).toBeInViewport();
    await context.close();
  });

  for (const p of pages) {
    test(`text-wrap: every h1 and h2 is balanced or pretty: /sl${p}`, async ({ browser, baseURL }) => {
      const { context, page } = await open(browser, baseURL!, { width: 390 });
      await page.goto(`/sl${p}`);
      const wraps = await page.locator("h1, h2").evaluateAll((els) =>
        els.map((el) => {
          const s = getComputedStyle(el) as CSSStyleDeclaration & { textWrapStyle?: string; textWrap?: string };
          return `${s.textWrapStyle ?? ""} ${s.textWrap ?? ""}`;
        }),
      );
      expect(wraps.length).toBeGreaterThan(0);
      for (const w of wraps) expect(w).toMatch(/balance|pretty/);
      await context.close();
    });
  }
});

test.describe("US-009 speed", () => {
  // The public pages' client bundle gets no new runtime library (the dependencies at development @ 05aa8c5).
  test("no new runtime dependency in the web app", () => {
    const pkg = JSON.parse(readFileSync(path.join(__dirname, "../package.json"), "utf8"));
    expect(Object.keys(pkg.dependencies).sort()).toEqual(
      [
        "@hookform/resolvers",
        "@jakamarinko/api",
        "@jakamarinko/types",
        "@tanstack/react-query",
        "better-auth",
        "class-variance-authority",
        "cn",
        "date-fns",
        "lucide-react",
        "next",
        "next-intl",
        "next-themes",
        "radix-ui",
        "react",
        "react-day-picker",
        "react-dom",
        "react-hook-form",
        "recharts",
        "shadcn",
        "sonner",
        "tw-animate-css",
        "zod",
      ].sort(),
    );
  });
});

// The hooks from docs/content/conversion-playbook.md, as pasted into the message files.
const lactatePrice = String(labTests.find((t) => t.id === "lactate-profile")!.priceCents / 100);
const hooks: Record<Locale, Record<string, string>> = Object.fromEntries(
  ([
    ["en", enHome, enLab, enCoaching, enContact, enLanding],
    ["sl", slHome, slLab, slCoaching, slContact, slLanding],
  ] as const).map(([locale, home, lab, coaching, contact, landing]) => [
    locale,
    {
      "": home.hero.title,
      "/lab": lab.hero.title,
      "/coaching": coaching.hero.title,
      "/contact": contact.title,
      ...Object.fromEntries(
        landingPages.map((p) => {
          const test = p.offer.kind === "test" ? labTests.find((t) => t.id === p.offer.id) : undefined;
          const separate = test && separatePrice(test);
          const title = landing.pages[p.slug as keyof typeof landing.pages].hero.title
            .replace("{price}", String((test?.priceCents ?? 0) / 100))
            .replace("{separate}", String((separate?.separateCents ?? 0) / 100));
          return [`/lp/${p.slug}`, title];
        }),
      ),
    },
  ]),
) as unknown as Record<Locale, Record<string, string>>;

test.describe("US-010 conversion", () => {
  for (const locale of locales) {
    for (const p of nonLegal) {
      test(`conversion: the h1 and one primary action fill the first screen: /${locale}${p}`, async ({ browser, baseURL }) => {
        for (const [width, height] of [
          [390, 844],
          [1440, 900],
        ] as const) {
          const { context, page } = await open(browser, baseURL!, { width, height });
          await page.goto(`/${locale}${p}`);
          await expect(page.getByRole("heading", { level: 1 })).toBeInViewport({ ratio: 1 });
          const primary = page.locator('[data-cta="primary"]');
          await expect(primary, `${width} px`).toHaveCount(1);
          await expect(primary).toBeInViewport({ ratio: 1 });
          const href = await primary.getAttribute("href");
          if (p === "/coaching") expect(href).toBe(`/${locale}/contact?package=coaching`);
          else if (p.startsWith("/lp/")) expect(href).toMatch(new RegExp(`^/${locale}/(booking\\?service=[a-z-]+|contact\\?package=[a-z-]+)$`));
          else expect(href).toMatch(new RegExp(`^/${locale}/booking(\\?service=[a-z-]+)?$`));
          await context.close();
        }
      });
    }
  }

  test("conversion: each hook is the playbook's, short, in both languages", async ({ page }) => {
    await page.context().addCookies([consentCookie(test.info().project.use.baseURL!)]);
    for (const p of Object.keys(hooks.en)) {
      expect(hooks.en[p]).toBeTruthy();
      expect(hooks.sl[p]).toBeTruthy();
      expect(hooks.en[p]).not.toBe(hooks.sl[p]);
      for (const locale of locales) {
        await page.goto(`/${locale}${p}`);
        const h1 = page.getByRole("heading", { level: 1 });
        await expect(h1).toHaveText(hooks[locale][p]!);
        expect(words((await h1.textContent())!), `${locale}${p} h1`).toBeLessThanOrEqual(10);
        const subline = page.locator("[data-subline]").first();
        if ((await subline.count()) > 0) {
          const text = (await subline.textContent())!;
          expect(words(text), `${locale}${p} subline`).toBeLessThanOrEqual(20);
          expect(text.match(/[.!?](?=\s+\p{Lu})/gu) ?? [], `${locale}${p} subline is one sentence`).toEqual([]);
        }
      }
    }
  });

  test("conversion: no paragraph over 45 words", async ({ page }) => {
    await page.context().addCookies([consentCookie(test.info().project.use.baseURL!)]);
    for (const locale of locales) {
      for (const p of nonLegal) {
        await page.goto(`/${locale}${p}`);
        const long = (await page.locator("main p").allTextContents()).filter((text) => words(text) > 45);
        expect(long, `${locale}${p}`).toEqual([]);
      }
    }
  });

  test("conversion: every section ends in an action", async ({ page }) => {
    await page.context().addCookies([consentCookie(test.info().project.use.baseURL!)]);
    for (const p of ["", "/lab", "/coaching", ...lpPages]) {
      await page.goto(`/en${p}`);
      const missing = await page.locator("main section").evaluateAll((sections) =>
        sections
          .filter((s) => {
            if (s.querySelector("[data-cta]")) return false;
            const next = (s.parentElement?.tagName === "MAIN" ? s : s.parentElement)?.nextElementSibling;
            return !next?.querySelector("[data-cta]") && !next?.matches("[data-cta]");
          })
          .map((s) => s.querySelector("h1, h2")?.textContent ?? s.className),
      );
      expect(missing, p).toEqual([]);
    }
  });

  test("conversion: lab and landing pages show the price before an objection FAQ", async ({ page }) => {
    await page.context().addCookies([consentCookie(test.info().project.use.baseURL!)]);
    const objections = (landing: typeof enLanding) => [
      landing.faq.preparation.question,
      landing.faq.fit.question,
      landing.faq.duration.question,
      landing.faq.cancel.question,
    ];
    for (const [locale, landing] of [
      ["en", enLanding],
      ["sl", slLanding],
    ] as const) {
      for (const p of ["/lab", ...lpPages]) {
        await page.goto(`/${locale}${p}`);
        const order = await page.evaluate(() => {
          const all = [...document.querySelectorAll("main *")];
          const price = all.findIndex((el) => el.children.length === 0 && /\d\s?€/.test(el.textContent ?? ""));
          const faq = all.findIndex((el) => el.tagName === "DETAILS");
          return { price, faq };
        });
        expect(order.price, `${locale}${p}`).toBeGreaterThanOrEqual(0);
        expect(order.price).toBeLessThan(order.faq);
        const questions = await page.locator("main details summary").allTextContents();
        expect(questions.length, `${locale}${p}`).toBeGreaterThanOrEqual(5);
        const isTest = p === "/lab" || landingPages.find((l) => `/lp/${l.slug}` === p)?.offer.kind === "test";
        if (isTest) {
          for (const q of objections(landing as typeof enLanding)) {
            if (p === "/lp/performance" && q === landing.faq.preparation.question) continue; // asks "Do I come fasted?"
            expect(questions.map((s) => s.trim()), `${locale}${p}`).toContain(q);
          }
          expect(questions.some((s) => s.trim() === landing.faq.whatYouGet.question)).toBe(true);
        }
      }
    }
  });

  test("conversion: proof comes within the first two sections after the hero", async ({ page }) => {
    await page.context().addCookies([consentCookie(test.info().project.use.baseURL!)]);
    for (const p of ["", "/lab"]) {
      await page.goto(`/en${p}`);
      const index = await page.locator("main section").evaluateAll((sections) => sections.findIndex((s) => s.hasAttribute("data-proof")));
      expect(index, p).toBeGreaterThanOrEqual(1);
      expect(index, p).toBeLessThanOrEqual(2);
    }
  });

  test("conversion: the phone bar shows after the hero, books, and steps aside while typing", async ({ browser, baseURL }) => {
    const { context, page } = await open(browser, baseURL!, { width: 390 });
    for (const p of ["", "/lab", "/lp/lactate-test"]) {
      await page.goto(`/en${p}`);
      const bar = page.locator("[data-sticky-cta]");
      await expect(bar).toHaveAttribute("data-shown", "false");
      await page.locator("[data-proof]").first().scrollIntoViewIfNeeded();
      await expect(bar).toHaveAttribute("data-shown", "true");
      await expect(bar).toBeInViewport();
      await expect(bar.getByRole("link")).toHaveAttribute("href", /^\/en\/booking/);
    }
    // Any field getting focus (a form further down, the browser's own) sends the bar away until it loses focus.
    await page.evaluate(() => {
      const input = document.createElement("input");
      input.id = "probe";
      document.querySelector("main")!.append(input);
      input.focus();
    });
    await expect(page.locator("[data-sticky-cta]")).toHaveAttribute("data-shown", "false");
    await page.locator("#probe").blur();
    await expect(page.locator("[data-sticky-cta]")).toHaveAttribute("data-shown", "true");
    await context.close();
  });

  test("conversion: honest wording, no AI and no fake urgency", async ({ page }) => {
    await page.context().addCookies([consentCookie(test.info().project.use.baseURL!)]);
    for (const locale of locales) {
      // The privacy policy is the one place that may name automated processing (CLAUDE.md).
      for (const p of pages.filter((p) => p !== "/legal/privacy")) {
        await page.goto(`/${locale}${p}`);
        const text = await page.locator("body").innerText();
        expect(text, `${locale}${p}`).not.toMatch(/\bAI\b|artificial intelligence|umetn[a-z]* inteligenc/i);
        expect(text, `${locale}${p}`).not.toMatch(/only \d+ (left|places|spots)|še (samo )?\d+ (prost|mest)/i);
        await expect(page.locator('[role="timer"]')).toHaveCount(0);
      }
    }
  });

  test("testimonials: sample quotes only in placeholder builds, always badged", async ({ page }) => {
    await page.context().addCookies([consentCookie(test.info().project.use.baseURL!)]);
    await page.goto("/en");
    const badges = page.locator("[data-sample-badge]");
    if (showPlaceholders) {
      await expect(badges).not.toHaveCount(0);
      for (const quote of await page.locator("blockquote").all()) {
        await expect(quote.locator("xpath=ancestor::li[1]").locator("[data-sample-badge]")).toHaveText("Sample");
      }
    } else {
      // Production build: no sample may ever be shown as a real customer.
      await expect(badges).toHaveCount(0);
      await expect(page.locator("[data-photo-slot]")).toHaveCount(0);
    }
  });
});
