import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { type Browser, type BrowserContext, expect, type Page, test } from "@playwright/test";
import { Client } from "pg";
import { serializeConsent } from "../src/lib/consent";

// T18 (docs/plan/tasks/T18-premium-polish.md): the header, language switch, account entry, sign-in, cookie sheet,
// booking progress and the mobile quality of sign-in, account and booking. One describe per user story.

const outbox = path.join(__dirname, "../../api/.emails");
const unique = (name: string) => `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
const consentCookie = (baseURL: string) => ({
  name: "jm_consent",
  value: encodeURIComponent(serializeConsent({ analytics: false, marketing: false })),
  url: baseURL,
});

async function sql(text: string, values: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54320/postgres" });
  await client.connect();
  try {
    return (await client.query(text, values)).rows;
  } finally {
    await client.end();
  }
}

// Every sign-in email sent to this address, newest first.
async function emailsTo(email: string) {
  const found: string[] = [];
  for (const file of (await readdir(outbox).catch(() => [])).sort().reverse()) {
    const html = await readFile(path.join(outbox, file), "utf8");
    if (html.includes(email)) found.push(html);
  }
  return found;
}

async function magicLink(email: string) {
  let link: string | undefined;
  await expect
    .poll(async () => {
      const hrefs = [...((await emailsTo(email))[0] ?? "").matchAll(/href="([^"]+)"/g)].map((m) => m[1]!.replaceAll("&amp;", "&"));
      return (link = hrefs.find((h) => h.includes("token=")));
    })
    .toBeTruthy();
  return link!;
}

// Signed in with health data consent, named Ana Novak, past the consent step.
async function signIn(page: Page, email = unique("polish")) {
  await page.goto("/en/sign-in");
  await page.locator("#email").fill(email);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  await page.goto(await magicLink(email));
  await expect(page).toHaveURL(/\/en\/consent/);
  expect((await page.request.post("/api/auth/consents", { data: { kind: "health_data", granted: true } })).ok()).toBe(true);
  await sql("update users set name = 'Ana Novak' where email = $1", [email]);
  return email;
}

// The dev api has no head coach unless HEAD_COACH_EMAIL is set: open every day 08–20 (as account.spec.ts does).
async function ensureBookableCoach() {
  await sql(
    `insert into users (id, name, email, email_verified, role) values ('e2e-coach', 'E2E Coach', 'e2e-coach@example.com', true, 'head_coach')
     on conflict (email) do nothing`,
  );
  await sql(`insert into coaches (user_id) select id from users where email = 'e2e-coach@example.com' on conflict (user_id) do nothing`);
  await sql(
    `insert into locations (name, address, is_default) select 'Laboratorij', 'Testna ulica 1, Ljubljana', true
     where not exists (select 1 from locations where is_default)`,
  );
  await sql(
    `insert into availability (coach_id, weekday, start, "end", location_id)
     select c.id, d, '08:00', '20:00', l.id from coaches c join users u on u.id = c.user_id
     cross join locations l cross join generate_series(1, 7) d
     where u.email = 'e2e-coach@example.com' and l.is_default
       and not exists (select 1 from availability a where a.coach_id = c.id)`,
  );
}

// An upcoming booking for this email through the public api, like the booking page makes.
async function bookFor(page: Page, email: string) {
  await ensureBookableCoach();
  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
  const slots = await (await page.request.get(`/api/booking/slots?service=performance&from=${day(3)}&to=${day(20)}`)).json();
  const slot = slots[Math.floor(Math.random() * slots.length)];
  const res = await page.request.post("/api/booking", {
    data: { service: "performance", coachId: slot.coachId, start: slot.start, name: "Ana Novak", email, phone: "+386 41 000 000", locale: "en" },
  });
  expect(res.status(), await res.text()).toBe(201);
}

const header = (page: Page) => page.locator("header").first();
const mainNav = (page: Page) => page.getByRole("navigation", { name: "Main menu" });

// ---------------------------------------------------------------------------------------------------------------
// The checks of US-005, for the pages this branch owns.

const widths = [320, 360, 375, 390, 414, 430, 768, 1024, 1440];
const tapWidths = [320, 375, 390];

async function noSidewaysScroll(page: Page, what: string) {
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(await fits(), `${what}: overflow after load`).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(await fits(), `${what}: overflow at the bottom`).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
}

// Every visible control at least 44 × 44. A control inside a label (or named by one) counts with its label, which
// is what a thumb hits; links inside running text are left out, as are skip links until focused.
async function tapTargets(page: Page, what: string) {
  const small = await page.evaluate(() => {
    const out: string[] = [];
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 1 && r.height > 1 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0;
    };
    for (const el of document.querySelectorAll("a, button, input, select, textarea, [role=button]")) {
      if (!visible(el)) continue;
      if (el.closest("p a, li > p a, label a, dd a") === el) continue;
      // The skip link until focused. The footer is premium-site's, checked in polish-site.spec.ts.
      if (el.matches('a[href="#main"]:not(:focus)') || el.closest("footer")) continue;
      if (el.matches("a") && el.parentElement && [...el.parentElement.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
        continue;
      let r = el.getBoundingClientRect();
      const label = el.closest("label") ?? (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null);
      if (label) {
        const l = label.getBoundingClientRect();
        r = new DOMRect(Math.min(r.left, l.left), Math.min(r.top, l.top), Math.max(r.right, l.right) - Math.min(r.left, l.left), Math.max(r.bottom, l.bottom) - Math.min(r.top, l.top));
      }
      if (r.width < 43.5 || r.height < 43.5) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    return out;
  });
  expect(small, `${what}: tap targets under 44 px`).toEqual([]);
}

async function inputFonts(page: Page, what: string) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, textarea")]
      .filter((el) => el.getBoundingClientRect().width > 1)
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
      .map((el) => `#${el.id} ${getComputedStyle(el).fontSize}`),
  );
  expect(small, `${what}: inputs under 16 px`).toEqual([]);
}

async function textSizes(page: Page, what: string) {
  const small = await page.evaluate(() => {
    const out: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || !n.textContent!.trim()) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1 || getComputedStyle(el).visibility === "hidden") continue;
      if (el.closest("[aria-hidden=true] svg, script, style, noscript")) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 12) out.push(`"${n.textContent!.trim().slice(0, 30)}" ${size}px`);
    }
    return out;
  });
  expect(small, `${what}: text under 12 px`).toEqual([]);
}

async function axe(page: Page, what: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), `${what}: axe`).toEqual([]);
}

async function sharpImages(page: Page, what: string) {
  const blurry = await page.evaluate(() =>
    [...document.images]
      .filter((img) => img.getBoundingClientRect().width > 1 && !/\.svg(\?|$)/.test(img.currentSrc))
      .filter((img) => img.naturalWidth < img.getBoundingClientRect().width * 2)
      .map((img) => `${img.currentSrc} ${img.naturalWidth} for ${Math.round(img.getBoundingClientRect().width)}`),
  );
  expect(blurry, `${what}: blurry images`).toEqual([]);
}

// Console errors and page errors while `run` goes.
async function noErrors(page: Page, what: string, run: () => Promise<void>) {
  const errors: string[] = [];
  const onConsole = (m: { type: () => string; text: () => string }) => m.type() === "error" && errors.push(m.text());
  const onError = (e: Error) => errors.push(e.message);
  page.on("console", onConsole);
  page.on("pageerror", onError);
  await run();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(200);
  page.off("console", onConsole);
  page.off("pageerror", onError);
  expect(errors, `${what}: console errors`).toEqual([]);
}

// What each width gets: overflow everywhere; tap targets at 320/375/390; fonts, text, axe and images at 390;
// axe again at 1440.
async function quality(page: Page, width: number, what: string) {
  // Judge the page at rest, not halfway through a step's entrance.
  await page.evaluate(() => Promise.allSettled(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
  await noSidewaysScroll(page, what);
  if (tapWidths.includes(width)) await tapTargets(page, what);
  if (width === 390) {
    await inputFonts(page, what);
    await textSizes(page, what);
    await axe(page, what);
    await sharpImages(page, what);
  }
  if (width === 1440) await axe(page, what);
}

async function withWidth(browser: Browser, baseURL: string, width: number, storageState?: Awaited<ReturnType<BrowserContext["storageState"]>>) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width, height: width < 700 ? 844 : 900 },
    deviceScaleFactor: width === 390 ? 3 : 1,
    storageState,
  });
  await context.addCookies([consentCookie(baseURL)]);
  return context;
}

// ---------------------------------------------------------------------------------------------------------------

test.describe("language", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([consentCookie(baseURL!)]);
  });

  test("language: one control named Language at 1440 px; Slovenian keeps the path and the query", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/coaching?package=elite");
    await expect(header(page).getByRole("button", { name: "Language" })).toHaveCount(1);
    await expect(header(page).getByRole("link", { name: "English" })).toHaveCount(0);
    await expect(header(page).getByRole("link", { name: "Slovenščina" })).toHaveCount(0);

    await header(page).getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitem", { name: "Slovenščina" }).click();
    await expect(page).toHaveURL(/\/sl\/coaching\?package=elite$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "sl");
    await expect(header(page).getByRole("button", { name: "Jezik" })).toHaveCount(1);

    // And back: the same URL in English.
    await header(page).getByRole("button", { name: "Jezik" }).click();
    await page.getByRole("menuitem", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/coaching\?package=elite$/);
  });

  test("language: keyboard only, with a visible focus ring", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/coaching");
    const control = header(page).getByRole("button", { name: "Language" });
    for (let i = 0; i < 20 && !(await control.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("Tab");
    await expect(control).toBeFocused();
    const ring = await control.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, shadow: s.boxShadow };
    });
    expect(ring.outline !== "none" || ring.shadow !== "none", JSON.stringify(ring)).toBe(true);

    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "English" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Slovenščina" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/sl\/coaching$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "sl");
  });

  test("language: the same switch in the phone menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/lab");
    await expect(header(page).getByRole("button", { name: "Language" })).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Main menu" });
    await menu.getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitem", { name: "Slovenščina" }).click();
    await expect(page).toHaveURL(/\/sl\/lab$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "sl");
  });

  test("language: switching mid-booking keeps the service", async ({ page }) => {
    await ensureBookableCoach();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/booking?service=vo2max");
    await expect(page.locator("#booking-step")).toHaveText("Pick a date and time");
    await header(page).getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitem", { name: "Slovenščina" }).click();
    await expect(page).toHaveURL(/\/sl\/booking\?service=vo2max$/);
    await expect(page.locator("#booking-step")).toHaveText("Izberi datum in uro");
  });
});

test.describe("header", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([consentCookie(baseURL!)]);
  });

  test("header: the current page is marked, and only that one", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/lab");
    await expect(mainNav(page).getByRole("link", { name: "Lab tests" })).toHaveAttribute("aria-current", "page");
    await expect(mainNav(page).locator("[aria-current]")).toHaveCount(1);
  });

  test("header: translucent and blurred once scrolled", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/lab");
    await expect(header(page)).toHaveAttribute("data-scrolled", "false");
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect(header(page)).toHaveAttribute("data-scrolled", "true");
    await expect.poll(() => header(page).evaluate((el) => getComputedStyle(el).backdropFilter)).toContain("blur");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header(page)).toHaveAttribute("data-scrolled", "false");
  });

  test("header: the phone menu is a modal dialog with scroll lock, focus trap and Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    const button = page.getByRole("button", { name: "Open menu" });
    await button.click();
    const menu = page.getByRole("dialog", { name: "Main menu" });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("aria-modal", "true");
    const overflow = await page.evaluate(() => [getComputedStyle(document.documentElement).overflow, getComputedStyle(document.body).overflow]);
    expect(overflow).toContain("hidden");

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      expect(await menu.evaluate((el) => el.contains(document.activeElement)), `Tab ${i + 1} left the menu`).toBe(true);
    }

    await expect(menu.getByRole("link", { name: "Book a test" })).toHaveAttribute("href", "/en/booking");
    await expect(menu.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/en/sign-in");
    await expect(menu.getByRole("button", { name: "Language" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
  });
});

test.describe("account menu", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([consentCookie(baseURL!)]);
  });

  // The public pages with the site header. Ad landing pages (only logo and language, by design: landing.spec.ts)
  // and the sign-in page itself have no account entry.
  const publicPages = ["", "/about", "/coaching", "/lab", "/contact", "/booking", "/legal/privacy", "/legal/terms", "/legal/cookies"];

  test("account menu: signed out, every public page offers Sign in", async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const locale of ["en", "sl"] as const) {
      for (const p of publicPages) {
        await page.goto(`/${locale}${p}`);
        const link = header(page).getByRole("link", { name: locale === "en" ? "Sign in" : "Prijava" });
        await expect(link, `/${locale}${p}`).toHaveAttribute("href", `/${locale}/sign-in`);
      }
    }
  });

  test("account menu: a customer gets their initials and exactly their pages; staff also the coach area; sign out", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const email = await signIn(page);
    await page.goto("/en/lab");
    const button = header(page).getByRole("button", { name: "Account menu" });
    await expect(button).toHaveText("AN");
    await expect(header(page).getByRole("link", { name: "Sign in" })).toHaveCount(0);

    await button.click();
    const items = page.getByRole("menuitem");
    await expect(items).toHaveText(["My account", "My bookings", "Sign out"]);
    await expect(page.getByRole("menuitem", { name: "My account" })).toHaveAttribute("href", "/en/account");
    await expect(page.getByRole("menuitem", { name: "My bookings" })).toHaveAttribute("href", "/en/account/bookings");
    await expect(page.getByRole("menuitem", { name: "Coach area" })).toHaveCount(0);
    await page.keyboard.press("Escape");

    // No name yet: the first letter of the email.
    await sql("update users set name = '' where email = $1", [email]);
    await page.reload();
    await expect(header(page).getByRole("button", { name: "Account menu" })).toHaveText(email[0]!.toUpperCase());

    await sql("update users set role = 'head_coach', name = 'Ana Novak' where email = $1", [email]);
    await page.reload();
    await header(page).getByRole("button", { name: "Account menu" }).click();
    await expect(page.getByRole("menuitem")).toHaveText(["My account", "My bookings", "Coach area", "Sign out"]);
    await expect(page.getByRole("menuitem", { name: "Coach area" })).toHaveAttribute("href", "/en/coach");
    await sql("update users set role = 'customer' where email = $1", [email]);

    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(header(page).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/en/sign-in");
    await page.goto("/en/account");
    await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Faccount$/);
  });

  test("account menu: on a phone, the open menu has the same account links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Main menu" });
    await expect(menu.getByRole("link", { name: "My account" })).toHaveAttribute("href", "/en/account");
    await expect(menu.getByRole("link", { name: "My bookings" })).toHaveAttribute("href", "/en/account/bookings");
    await expect(menu.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Sign in" })).toHaveCount(0);

    await menu.getByRole("link", { name: "My bookings" }).click();
    await expect(page).toHaveURL(/\/en\/account\/bookings$/);
  });
});

test.describe("sign-in", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([consentCookie(baseURL!)]);
  });

  test("sign-in: form and brand panel side by side at 1440 px, form first on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/sign-in");
    const form = (await page.locator("main").boundingBox())!;
    const panel = (await page.locator("aside").boundingBox())!;
    expect(form.width).toBeGreaterThan(400);
    expect(panel.width).toBeGreaterThan(400);
    const overlap = form.x < panel.x + panel.width && panel.x < form.x + form.width && form.y < panel.y + panel.height && panel.y < form.y + form.height;
    expect(overlap).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    const field = (await page.locator("#email").boundingBox())!;
    const phonePanel = (await page.locator("aside").boundingBox())!;
    expect(field.y).toBeLessThan(844);
    expect(field.y).toBeLessThan(phonePanel.y);
  });

  test("sign-in: an invalid email is caught on the page and sends nothing", async ({ page }) => {
    await page.goto("/en/sign-in");
    const sent: string[] = [];
    page.on("request", (r) => r.url().includes("/api/auth/sign-in/magic-link") && sent.push(r.url()));
    await page.locator("#email").fill("bad@");
    await page.locator("form button[type=submit]").click();
    await expect(page.locator("#email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#email-error")).toHaveText("Enter a valid email address.");
    await expect(page.locator("#email")).toBeFocused();
    expect(sent).toEqual([]);
  });

  test("sign-in: sent state with the email, resend after a 30 s cooldown sends a second link", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en/sign-in");
    const email = unique("polish");
    await page.locator("#email").fill(email);
    await page.locator("form button[type=submit]").click();
    await expect(page.getByRole("status").filter({ hasText: email })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check your inbox");
    const resend = page.getByRole("button", { name: /^Send again in \d+ s$/ });
    await expect(resend).toBeDisabled();
    const seconds = Number(/(\d+)/.exec((await resend.textContent())!)![1]);
    expect(seconds).toBeGreaterThanOrEqual(30);
    await expect.poll(async () => (await emailsTo(email)).length).toBe(1);

    await page.clock.runFor(31_000);
    const again = page.getByRole("button", { name: "Send the link again" });
    await expect(again).toBeEnabled();
    await again.click();
    await expect(page.getByText("Sent again. Use the newest link.")).toBeVisible();
    await expect.poll(async () => (await emailsTo(email)).length).toBe(2);
    await expect(page.getByRole("button", { name: /^Send again in \d+ s$/ })).toBeDisabled();
  });

  test("sign-in: no Google button while Google isn't set up", async ({ page }) => {
    const providers = await (await page.request.get("/api/auth/providers")).json();
    test.skip(providers.google, "this api has Google credentials");
    await page.goto("/en/sign-in");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  });

  test("sign-in: the email field is 16 px or more on a phone (no zoom on focus)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/sign-in");
    const size = await page.locator("#email").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
  });

  test("sign-in: every check at every width, in both languages, before and after sending", async ({ browser, baseURL }) => {
    test.setTimeout(600_000);
    for (const width of widths) {
      const context = await withWidth(browser, baseURL!, width);
      const page = await context.newPage();
      for (const locale of ["en", "sl"]) {
        await noErrors(page, `${width} ${locale} sign-in`, async () => {
          await page.goto(`/${locale}/sign-in`);
        });
        await quality(page, width, `${width} ${locale} sign-in`);
        if (tapWidths.includes(width) || width === 1440) {
          await page.locator("#email").fill(unique("polish"));
          await page.locator("form button[type=submit]").click();
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(locale === "en" ? "Check your inbox" : "Preveri svoj nabiralnik");
          await quality(page, width, `${width} ${locale} sign-in sent`);
        }
      }
      await context.close();
    }
  });
});

test.describe("cookie sheet", () => {
  test("cookie sheet: compact on a phone, clear of the hero headline and its Book button, above the home bar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    const sheet = page.getByRole("region", { name: "Cookies" });
    await expect(sheet).toBeVisible();
    await sheet.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const box = (await sheet.boundingBox())!;
    expect(box.height).toBeLessThanOrEqual(844 * 0.4);

    const intersects = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
      a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const h1 = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    // The hero's primary call to action: the first link into the booking.
    const book = (await page.getByRole("main").locator('a[href*="/booking"]').first().boundingBox())!;
    expect(intersects(box, h1)).toBe(false);
    expect(intersects(box, book)).toBe(false);

    // Its bottom padding is max(1rem, safe area): never less than the 1rem it has without a home bar.
    const padding = await sheet.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
    expect(padding).toBeGreaterThanOrEqual(16);
  });
});

test.describe("booking", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([consentCookie(baseURL!)]);
    await ensureBookableCoach();
  });

  test("booking: the progress says which step of four, in both languages", async ({ page }) => {
    for (const [locale, label, name] of [
      ["en", "Step 2 of 4", "Date and time"],
      ["sl", "Korak 2 od 4", "Datum in ura"],
    ] as const) {
      await page.goto(`/${locale}/booking?service=lactate-profile`);
      const current = page.locator("[aria-current=step]");
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute("aria-label", new RegExp(`^${label}`));
      await expect(current).toContainText(name);
    }
  });

  test("booking: with reduced motion, changing steps runs no animation", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, reducedMotion: "reduce" });
    await context.addCookies([consentCookie(baseURL!)]);
    const page = await context.newPage();
    const running = () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
    await page.goto("/en/booking");
    await page.getByRole("radio", { name: /Lactate profile/ }).check({ force: true });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("#booking-step")).toHaveText("Pick a date and time");
    await page.waitForTimeout(300);
    expect(await running()).toBe(0);

    await page.locator('label:has(input[name="time"])').first().click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("#booking-step")).toHaveText("Your details");
    await page.waitForTimeout(300);
    expect(await running()).toBe(0);
    await context.close();
  });

  test("booking: every step at every width, in both languages", async ({ browser, baseURL }) => {
    test.setTimeout(600_000);
    const copy = {
      en: { next: "Continue", details: "Your details", review: "Check and confirm", name: "Full name", consent: /I agree/, terms: /I accept the/ },
      sl: { next: "Naprej", details: "Tvoji podatki", review: "Preveri in potrdi", name: "Ime in priimek", consent: /Strinjam se/, terms: /Sprejemam/ },
    } as const;
    for (const width of widths) {
      const context = await withWidth(browser, baseURL!, width);
      const page = await context.newPage();
      for (const locale of ["en", "sl"] as const) {
        const t = copy[locale];
        const at = (step: string) => `${width} ${locale} booking ${step}`;
        await noErrors(page, at("service"), async () => {
          await page.goto(`/${locale}/booking`);
        });
        await quality(page, width, at("service"));
        await page.locator('input[name="service"][value="lactate-profile"]').check({ force: true });
        await page.getByRole("button", { name: t.next }).click();
        await expect(page.locator('input[name="time"]').first()).toBeAttached({ timeout: 20_000 });
        await quality(page, width, at("time"));
        await page.locator('label:has(input[name="time"])').first().click();
        await quality(page, width, at("time, picked"));
        await page.getByRole("button", { name: t.next, exact: true }).click();
        await expect(page.locator("#booking-step")).toHaveText(t.details);
        await quality(page, width, at("details"));
        await page.getByLabel(t.name).fill("Ana Novak");
        await page.getByLabel(locale === "en" ? "Email" : "E-pošta", { exact: true }).fill(unique("polish"));
        await page.getByLabel(locale === "en" ? "Phone" : "Telefon", { exact: true }).fill("041 555 666");
        for (const q of await page.locator("fieldset fieldset").all()) await q.locator('input[value="no"]').check();
        await page.getByRole("checkbox", { name: t.consent }).check();
        await page.getByRole("checkbox", { name: t.terms }).check();
        await page.getByRole("button", { name: t.next, exact: true }).click();
        await expect(page.locator("#booking-step")).toHaveText(t.review);
        await quality(page, width, at("review"));
      }
      await context.close();
    }
  });
});

test.describe("account", () => {
  test("account: every page, signed in, at every width and in both languages", async ({ browser, baseURL }) => {
    test.setTimeout(600_000);
    const setup = await browser.newContext({ baseURL });
    await setup.addCookies([consentCookie(baseURL!)]);
    const page0 = await setup.newPage();
    const email = await signIn(page0);
    await bookFor(page0, email);
    const state = await setup.storageState();
    await setup.close();

    for (const width of widths) {
      const context = await withWidth(browser, baseURL!, width, state);
      const page = await context.newPage();
      for (const locale of ["en", "sl"]) {
        for (const p of ["/account", "/account/bookings", "/account/profile", "/account/privacy"]) {
          const what = `${width} ${locale}${p}`;
          await noErrors(page, what, async () => {
            await page.goto(`/${locale}${p}`);
            await expect(page.locator('[data-state="loading"]:visible')).toHaveCount(0);
          });
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await quality(page, width, what);
        }
      }
      await context.close();
    }
  });
});
