import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { Client } from "pg";
import { serializeConsent } from "../src/lib/consent";

// Google Calendar settings (T16). The e2e api has no Google keys, so the page says sync is off; the connected
// states are covered by the api tests against a fake Google.
test.beforeEach(async ({ context, baseURL }) => {
  const value = encodeURIComponent(serializeConsent({ analytics: false, marketing: false }));
  await context.addCookies([{ name: "jm_consent", value, url: baseURL! }]);
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

// Signed in by magic link as a coach with a calendar.
async function signInAsCoach(page: Page) {
  const email = `calendar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
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
  await sql("update users set role = 'coach' where email = $1", [email]);
  await sql("insert into coaches (user_id) select id from users where email = $1", [email]);
}

test("a coach finds Google Calendar in settings; without keys it says sync isn't set up", async ({ page }) => {
  await signInAsCoach(page);
  await page.goto("/en/coach/settings");
  await page.getByRole("link", { name: /Google Calendar/ }).click();
  await expect(page).toHaveURL(/\/en\/coach\/settings\/calendar$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Google Calendar");
  await expect(page.getByText("Calendar sync isn't set up yet")).toBeVisible();

  await page.goto("/sl/coach/settings/calendar");
  await expect(page.getByText("Sinhronizacija koledarja še ni nastavljena")).toBeVisible();
});

test("coming back from Google with a result shows it once and drops it from the address", async ({ page }) => {
  await signInAsCoach(page);
  await page.goto("/en/coach/settings/calendar?result=denied");
  await expect(page.locator("[data-notice]")).toContainText("You didn't allow access");
  await expect(page).toHaveURL(/\/en\/coach\/settings\/calendar$/);
});
