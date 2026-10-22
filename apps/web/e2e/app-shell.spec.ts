import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { Client } from "pg";
import type { Role } from "@jakamarinko/types";
import { serializeConsent } from "../src/lib/consent";

// A cookie choice is already made, so the cookie banner doesn't cover the shell.
test.beforeEach(async ({ context, baseURL }) => {
  const value = encodeURIComponent(serializeConsent({ analytics: false, marketing: false }));
  await context.addCookies([{ name: "jm_consent", value, url: baseURL! }]);
});

const outbox = path.join(__dirname, "../../api/.emails");
const unique = (name: string) => `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;

async function magicLink(email: string) {
  let link: string | undefined;
  await expect
    .poll(async () => {
      const files = (await readdir(outbox).catch(() => [])).sort().reverse();
      for (const file of files) {
        const html = await readFile(path.join(outbox, file), "utf8");
        if (html.includes(email)) return (link = /href="([^"]+)"/.exec(html)?.[1]?.replaceAll("&amp;", "&"));
      }
    })
    .toBeTruthy();
  return link!;
}

// No admin screen gives roles yet, so the test sets it in this worktree's database.
async function setRole(email: string, role: Role) {
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54320/postgres" });
  await client.connect();
  try {
    await client.query("update users set role = $1 where email = $2", [role, email]);
  } finally {
    await client.end();
  }
}

// A signed-in user with health data consent, past the consent step.
async function signInAs(page: Page, role: Role) {
  const email = unique(role);
  await page.goto("/en/sign-in");
  await page.locator("#email").fill(email);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  await page.goto(await magicLink(email));
  await expect(page).toHaveURL(/\/en\/consent/);
  expect((await page.request.post("/api/auth/consents", { data: { kind: "health_data", granted: true } })).ok()).toBe(true);
  if (role !== "customer") await setRole(email, role);
  return email;
}

const heading = (page: Page) => page.getByRole("heading", { level: 1 });
// For the PR: only when SHELL_SCREENSHOTS names a folder.
const shot = (page: Page, name: string) =>
  process.env.SHELL_SCREENSHOTS ? page.screenshot({ path: path.join(process.env.SHELL_SCREENSHOTS, name) }) : undefined;
const openUserMenu = (page: Page) => page.getByRole("button", { name: "Account menu" }).click();

test("signed out, both areas send you to sign in with a return URL", async ({ page }) => {
  await page.goto("/en/coach/bookings");
  await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Fcoach$/);
  await page.goto("/sl/account/privacy");
  await expect(page).toHaveURL(/\/sl\/sign-in\?next=%2Faccount$/);
});

test("a customer gets their account and a 404 in the coach area", async ({ page }) => {
  const email = await signInAs(page, "customer");
  expect((await page.goto("/en/coach"))?.status()).toBe(404);

  await page.goto("/en/account");
  await expect(heading(page)).toHaveText("My account");
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Menu" });
  await expect(menu.getByRole("link")).toHaveText(["My bookings", "Profile", "Privacy"]);

  await menu.getByRole("link", { name: "Privacy" }).click();
  await expect(heading(page)).toHaveText("Privacy");
  await expect(menu.getByRole("link", { name: "Privacy" })).toHaveAttribute("aria-current", "page");

  await openUserMenu(page);
  await expect(page.getByRole("menuitem", { name: "Switch to coach view" })).toHaveCount(0);
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/en\/sign-in$/);
});

test("a coach reaches both areas and switches language and view from the user menu", async ({ page }) => {
  await signInAs(page, "coach");
  await page.goto("/en/coach");
  await expect(heading(page)).toHaveText("Today");
  await expect(page.getByText("Nothing booked for today")).toBeVisible();

  const menu = page.getByRole("navigation", { name: "Menu" });
  await expect(menu.getByRole("link")).toHaveText(["Today", "Bookings", "Requests", "Settings"]);
  await expect(menu.getByText("Athletes")).toHaveAttribute("aria-disabled", "true");
  // One coach only: no calendar switcher.
  await expect(page.getByLabel("Calendar of")).toHaveCount(0);

  await menu.getByRole("link", { name: "Bookings" }).click();
  await expect(heading(page)).toHaveText("Bookings");

  await openUserMenu(page);
  await shot(page, "desktop-en-coach-user-menu.png");
  await page.getByRole("menuitem", { name: "Slovenščina" }).click();
  await expect(page).toHaveURL(/\/sl\/coach\/bookings$/);
  await expect(heading(page)).toHaveText("Rezervacije");

  await page.getByRole("button", { name: "Meni računa" }).click();
  await page.getByRole("menuitem", { name: "Preklopi na moj račun" }).click();
  await expect(page).toHaveURL(/\/sl\/account$/);
  await expect(heading(page)).toHaveText("Moj račun");

  await page.getByRole("button", { name: "Meni računa" }).click();
  await page.getByRole("menuitem", { name: "Preklopi na pogled trenerja" }).click();
  await expect(page).toHaveURL(/\/sl\/coach$/);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the menu opens in a sheet and closes after picking a page", async ({ page }) => {
    await signInAs(page, "head_coach");
    await page.goto("/en/coach");
    await page.getByRole("button", { name: "Open menu" }).click();
    const sheet = page.getByRole("dialog", { name: "Coach" });
    await expect(sheet).toBeVisible();
    await sheet.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    await shot(page, "375-en-coach-menu-open.png");
    await sheet.getByRole("link", { name: "Requests" }).click();
    await expect(sheet).toBeHidden();
    await expect(heading(page)).toHaveText("Requests");
  });
});

// Every shell page in both languages at both widths: renders its heading, no sideways scrolling.
// Screenshots go to SHELL_SCREENSHOTS when set (for the PR), otherwise next to the test results.
const pages = ["/coach", "/coach/bookings", "/coach/requests", "/coach/settings", "/account", "/account/bookings", "/account/profile", "/account/privacy"];

for (const width of [375, 1440]) {
  test(`every shell page renders in both languages at ${width} px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
    await signInAs(page, "coach");
    for (const locale of ["en", "sl"]) {
      for (const p of pages) {
        await page.goto(`/${locale}${p}`);
        await expect(heading(page)).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        const name = `${width}-${locale}${p.replaceAll("/", "-")}.png`;
        const dir = process.env.SHELL_SCREENSHOTS;
        await page.screenshot({ path: dir ? path.join(dir, name) : info.outputPath(name), fullPage: true });
      }
    }
  });
}
