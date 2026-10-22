import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import type { TagsConfig } from "@jakamarinko/api";
import { getAttribution } from "../src/lib/utm";

const umamiSrc = "https://umami.test/script.js";
const isMarketing = (url: string) => /connect\.facebook\.net|googletagmanager\.com/.test(url);

// Pretends the server has all ids set and answers every tag script with an empty one, recording what was asked for.
async function withTags(context: BrowserContext) {
  const config: TagsConfig = { umami: { src: umamiSrc, websiteId: "w1" }, metaPixelId: "123", googleTagId: "G-TEST" };
  await context.route("**/api/events/config", (route) => route.fulfill({ json: config }));
  const requested: string[] = [];
  await context.route(/umami\.test|connect\.facebook\.net|googletagmanager\.com/, (route) => {
    requested.push(route.request().url());
    return route.fulfill({ contentType: "text/javascript", body: "" });
  });
  return requested;
}

// Tags are decided once the config has arrived and the page has settled.
async function visit(page: Page, path: string) {
  const config = page.waitForResponse("**/api/events/config");
  await page.goto(path);
  await config;
  await page.waitForLoadState("networkidle");
}

test("marketing tags load only after accept all", async ({ page, context }) => {
  const requested = await withTags(context);
  await visit(page, "/en");

  await expect(page.getByRole("region", { name: "Cookies" })).toBeVisible();
  expect(requested).toContain(umamiSrc);
  expect(requested.filter(isMarketing)).toEqual([]);

  await page.getByRole("button", { name: "Accept all" }).click();
  await expect.poll(() => requested.filter(isMarketing).length).toBeGreaterThanOrEqual(2);
  expect(requested.some((u) => u.includes("connect.facebook.net/en_US/fbevents.js"))).toBe(true);
  expect(requested.some((u) => u.includes("googletagmanager.com/gtag/js?id=G-TEST"))).toBe(true);
  await expect(page.getByRole("region", { name: "Cookies" })).toBeHidden();
});

test("after reject all marketing tags never load, also on the next page", async ({ page, context }) => {
  const requested = await withTags(context);
  await visit(page, "/sl");
  await page.getByRole("button", { name: "Zavrni vse" }).click();
  await expect(page.getByRole("region", { name: "Piškotki" })).toBeHidden();

  requested.length = 0;
  await visit(page, "/en");
  await expect(page.getByRole("region", { name: "Cookies" })).toBeHidden();
  expect(requested).toEqual([]);
});

test("the settings dialog saves a choice per category", async ({ page, context }) => {
  const requested = await withTags(context);
  await visit(page, "/en");
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Cookie settings" });
  await expect(dialog.getByRole("checkbox", { name: "Necessary" })).toBeDisabled();
  await dialog.getByRole("checkbox", { name: "Marketing" }).check();
  await dialog.getByRole("button", { name: "Save choice" }).click();

  await expect.poll(() => requested.filter(isMarketing).length).toBeGreaterThanOrEqual(2);
  const consent = (await context.cookies()).find((c) => c.name === "jm_consent");
  expect(JSON.parse(decodeURIComponent(consent!.value))).toEqual({ v: 1, analytics: false, marketing: true });
});

test("with no ids set nothing loads and nothing errors", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const external: string[] = [];
  page.on("request", (r) => !r.url().startsWith("http://localhost") && external.push(r.url()));

  await visit(page, "/en");
  await page.getByRole("button", { name: "Accept all" }).click();
  await visit(page, "/sl");

  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  expect((await context.cookies()).some((c) => c.name === "jm_consent")).toBe(true);
});

test("the ad source is remembered across pages", async ({ page, context }) => {
  await visit(page, "/en?utm_source=instagram&utm_campaign=x");
  await visit(page, "/sl");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await visit(page, "/sl");

  const cookies = (await context.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  expect(getAttribution(cookies)).toEqual({ utm_source: "instagram", utm_campaign: "x" });
});
