import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { Client } from "pg";
import { landingPages } from "../src/components/landing/pages";
import { serializeConsent } from "../src/lib/consent";
import slLanding from "../messages/sl/landing.json";

test.beforeEach(async ({ context, baseURL }) => {
  const value = encodeURIComponent(serializeConsent({ analytics: false, marketing: false }));
  await context.addCookies([{ name: "jm_consent", value, url: baseURL! }]);
});

for (const locale of ["en", "sl"] as const) {
  for (const { slug } of landingPages) {
    test(`/${locale}/lp/${slug}: one offer, noindex, only the logo and the language switch`, async ({ page }) => {
      const res = await page.goto(`/${locale}/lp/${slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      // The header holds the logo link and the language switch, nothing else.
      const header = page.locator("header").first();
      await expect(header.getByRole("link")).toHaveCount(3);
      await expect(header.getByRole("navigation")).toHaveCount(1);
      // Every call to action goes to the same place; the only other link is the lab's address in maps.
      const hrefs = await page.locator("main a").evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute("href")))]);
      const internal = hrefs.filter((href) => href?.startsWith("/"));
      expect(hrefs.filter((href) => !href?.startsWith("/"))).toEqual([expect.stringMatching(/^https:\/\/www\.google\.com\/maps\/search\//)]);
      expect(internal).toHaveLength(1);
      expect(internal[0]).toMatch(new RegExp(`^/${locale}/(booking\\?service=|contact\\?package=)`));
    });
  }
}

test("an unknown landing page is a 404, and the sitemap has none", async ({ page, request }) => {
  expect((await page.goto("/en/lp/nope"))?.status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/lp/");
});

test("the language switch keeps the landing page", async ({ page }) => {
  await page.goto("/en/lp/lactate-test");
  await page.locator("header").getByRole("link", { name: "Slovenščina" }).click();
  await expect(page).toHaveURL(/\/sl\/lp\/lactate-test$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(slLanding.pages["lactate-test"].hero.title);
});

const outbox = path.join(__dirname, "../../api/.emails");

async function sql(text: string, values: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54320/postgres" });
  await client.connect();
  try {
    return (await client.query(text, values)).rows;
  } finally {
    await client.end();
  }
}

async function signInAs(page: Page, role: "owner" | "coach") {
  const email = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  await page.goto("/en/sign-in");
  await page.locator("#email").fill(email);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  let link = "";
  await expect
    .poll(async () => {
      for (const file of (await readdir(outbox).catch(() => [])).filter((f) => f.endsWith(".html"))) {
        const html = await readFile(path.join(outbox, file), "utf8");
        if (html.includes(email)) return (link = /href="([^"]+)"/.exec(html)![1]!.replaceAll("&amp;", "&"));
      }
    })
    .toBeTruthy();
  await page.goto(link);
  await expect(page).toHaveURL(/\/en\/consent/);
  expect((await page.request.post("/api/auth/consents", { data: { kind: "health_data", granted: true } })).ok()).toBe(true);
  await sql("update users set role = $1 where email = $2", [role, email]);
}

test("the owner sees bookings and revenue by ad source; a coach has no menu entry and gets a 404", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/en/coach");
  await page.getByRole("link", { name: "Ad sources" }).first().click();
  await expect(page).toHaveURL(/\/en\/coach\/ad-sources/);
  await expect(page.getByRole("heading", { level: 1, name: "Ad sources" })).toBeVisible();
  await page.getByLabel("From").fill("2020-01-01");
  await page.getByLabel("To").fill("2020-01-31");
  await page.getByRole("button", { name: "Show" }).click();
  await expect(page).toHaveURL(/from=2020-01-01&to=2020-01-31/);
  await expect(page.getByText("No bookings in this period")).toBeVisible();

  await page.context().clearCookies();
  await signInAs(page, "coach");
  await page.goto("/en/coach");
  await expect(page.getByRole("link", { name: "Ad sources" })).toHaveCount(0);
  expect((await page.goto("/en/coach/ad-sources"))?.status()).toBe(404);
});
