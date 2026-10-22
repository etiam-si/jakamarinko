import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { Client } from "pg";
import { serializeConsent } from "../src/lib/consent";

// A cookie choice is already made, so the cookie banner doesn't cover the account.
test.beforeEach(async ({ context, baseURL }) => {
  const value = encodeURIComponent(serializeConsent({ analytics: false, marketing: false }));
  await context.addCookies([{ name: "jm_consent", value, url: baseURL! }]);
});

const outbox = path.join(__dirname, "../../api/.emails");
const unique = (name: string) => `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
const heading = (page: Page) => page.getByRole("heading", { level: 1 });
// While a block streams in, its loading fallback and its content are both in the DOM; only one is visible.
const block = (page: Page, id: string) => page.locator(`[data-block="${id}"]:visible`);
// Screenshots for the PR go to SHELL_SCREENSHOTS when set, otherwise next to the test results.
const shot = (page: Page, name: string, outputPath: (name: string) => string) =>
  page.screenshot({ path: process.env.SHELL_SCREENSHOTS ? path.join(process.env.SHELL_SCREENSHOTS, `t15-${name}`) : outputPath(name), fullPage: true });

// The first link of the newest email (written after `since`) whose html contains `needle`.
async function linkFrom(needle: string, since = "") {
  let link: string | undefined;
  await expect
    .poll(async () => {
      const files = (await readdir(outbox).catch(() => [])).filter((f) => f.endsWith(".html") && f >= since).sort().reverse();
      for (const file of files) {
        const html = await readFile(path.join(outbox, file), "utf8");
        if (html.includes(needle)) return (link = /href="([^"]+)"/.exec(html)?.[1]?.replaceAll("&amp;", "&"));
      }
    })
    .toBeTruthy();
  return link!;
}
const fileStamp = () => new Date().toISOString().replace(/[:.]/g, "-");

async function sql(query: string, values: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54320/postgres" });
  await client.connect();
  try {
    return (await client.query(query, values)).rows;
  } finally {
    await client.end();
  }
}

// The dev api has no head coach unless HEAD_COACH_EMAIL is set, so the test brings its own: open every day 08–20.
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

// A guest books the Performance package (nobody signed in), through the public api like the booking page does.
async function bookAsGuest(page: Page, email: string) {
  await ensureBookableCoach();
  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
  const slots = await (await page.request.get(`/api/booking/slots?service=performance&from=${day(3)}&to=${day(20)}`)).json();
  expect(slots.length).toBeGreaterThan(0);
  const slot = slots[Math.floor(Math.random() * slots.length)];
  const res = await page.request.post("/api/booking", {
    data: { service: "performance", coachId: slot.coachId, start: slot.start, name: "Ana Novak", email, phone: "+386 41 000 000", locale: "en" },
  });
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()).booking as { id: string };
}

async function signIn(page: Page, email: string) {
  await page.goto("/en/sign-in");
  await page.locator("#email").fill(email);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  await page.goto(await linkFrom(email));
  await expect(page).toHaveURL(/\/en\/consent/);
  expect((await page.request.post("/api/auth/consents", { data: { kind: "health_data", granted: true } })).ok()).toBe(true);
}

test("a guest booking joins the account: overview, bookings, profile, privacy, then deletion and a fresh account", async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const email = unique("guest");
  const booking = await bookAsGuest(page, email);

  await signIn(page, email);
  await page.goto("/en/account");
  await expect(heading(page)).toHaveText("My account");
  const next = block(page, "next-booking");
  await expect(next).toHaveAttribute("data-state", "ready");
  await expect(next.getByText("Performance package")).toBeVisible();
  await expect(next.getByText(/^Starts in \d+ days$/)).toBeVisible();
  await expect(next.getByRole("heading", { name: "How to prepare" })).toBeVisible();
  // The Performance package includes the fat and carbohydrate test.
  await expect(next.getByText(/fasted/i)).toBeVisible();
  await expect(next.getByRole("link", { name: "Add to calendar" })).toHaveAttribute("href", `/api/account/bookings/${booking.id}/calendar?locale=en`);
  await expect(block(page, "profile")).toContainText("1 of 2 filled in");
  await shot(page, "1440-en-account-overview.png", info.outputPath.bind(info));

  const ics = await page.request.get(`/api/account/bookings/${booking.id}/calendar?locale=en`);
  expect(await ics.text()).toContain("SUMMARY:Performance package\\, Jaka Marinko");

  // Bookings: listed as upcoming, with cancel and calendar.
  await page.goto("/en/account/bookings");
  const item = page.locator(`[data-booking="${booking.id}"]`);
  await expect(item.getByRole("heading", { name: "Performance package" })).toBeVisible();
  await expect(item.getByText("Confirmed")).toBeVisible();
  await shot(page, "1440-en-account-bookings.png", info.outputPath.bind(info));

  // Profile: the phone came from the booking; saving a name completes it, a new language switches the site.
  await page.goto("/en/account/profile");
  await expect(page.locator("#phone")).toHaveValue("+386 41 000 000");
  await page.locator("#name").fill("Ana Novak");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").getByText("Saved.")).toBeVisible();
  await page.goto("/en/account");
  await expect(block(page, "profile")).toContainText("2 of 2 filled in");
  await page.goto("/en/account/profile");
  await page.getByRole("combobox", { name: "Language" }).click();
  await page.getByRole("option", { name: "Slovenščina" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/sl\/account\/profile$/);
  await expect(heading(page)).toHaveText("Profil");
  expect((await (await page.request.get("/api/account/profile")).json()).locale).toBe("sl");
  await page.goto("/sl/account");
  await expect(block(page, "next-booking").getByText("Performance paket")).toBeVisible();
  await expect(block(page, "next-booking").getByText(/^Začetek čez \d+ dni$/)).toBeVisible();
  await shot(page, "1440-sl-account-overview.png", info.outputPath.bind(info));

  // Privacy: consents with dates; withdrawing health data first says what stops working.
  await page.goto("/en/account/privacy");
  const health = page.locator('[data-consent="health_data"]');
  await expect(health.getByText(/^Given on /)).toBeVisible();
  await expect(page.locator('[data-consent="marketing"]').getByText("Not given")).toBeVisible();
  await page.locator('[data-consent="marketing"]').getByRole("button", { name: "Give consent" }).click();
  await expect(page.locator('[data-consent="marketing"]').getByText(/^Given on /)).toBeVisible();
  await page.locator('[data-consent="marketing"]').getByRole("button", { name: "Withdraw" }).click();
  await expect(page.locator('[data-consent="marketing"]').getByText("Not given")).toBeVisible();
  await page.getByText("History").click();
  await expect(page.getByText(/News and offers by email: given .*, withdrawn /)).toBeVisible();

  await health.getByRole("button", { name: "Withdraw" }).click();
  const dialog = page.getByRole("dialog", { name: "Withdraw consent for your health data?" });
  await expect(dialog.getByText("We can't record your lab results or prepare a training plan for you.")).toBeVisible();
  await shot(page, "1440-en-account-privacy-withdraw.png", info.outputPath.bind(info));
  await dialog.getByRole("button", { name: "Keep it" }).click();
  await expect(dialog).toBeHidden();

  // Export: a zip download.
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download my data" }).click();
  expect((await download).suggestedFilename()).toMatch(/^jakamarinko-data-\d{4}-\d{2}-\d{2}\.zip$/);

  // Deleting needs no upcoming bookings: cancel it first, in the bookings page.
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "upcoming" })).toHaveText("You have upcoming bookings. Cancel them first, or write to us.");
  await page.goto("/en/account/bookings");
  await item.getByRole("button", { name: "Cancel booking" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yes, cancel it" }).click();
  await expect(item.getByText("Cancelled")).toBeVisible();

  // Delete: a link by email, confirmed while signed in.
  await page.goto("/en/account/privacy");
  const since = fileStamp();
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page.getByRole("status").filter({ hasText: "We sent a confirmation link" })).toContainText(email);
  // The profile language is Slovenian now, so the email and its link are too.
  const link = await linkFrom("/account/privacy/delete?token=", since);
  expect(new URL(link).pathname).toBe("/sl/account/privacy/delete");
  await page.goto(link);
  await expect(heading(page)).toHaveText("Izbriši svoj račun");
  await shot(page, "1440-sl-account-delete-confirm.png", info.outputPath.bind(info));
  await page.getByRole("button", { name: "Dokončno izbriši moj račun" }).click();
  await expect(page.getByRole("heading", { name: "Tvoj račun je izbrisan" })).toBeVisible();

  // The coach's booking row stays, anonymised.
  const [row] = await sql("select customer_user_id, customer_name, customer_email, health_answers from bookings where id = $1", [booking.id]);
  expect(row).toEqual({ customer_user_id: null, customer_name: "", customer_email: "", health_answers: null });
  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Faccount$/);

  // Signing in again with the same email: a fresh, empty account.
  await signIn(page, email);
  await page.goto("/en/account");
  await expect(block(page, "next-booking")).toHaveAttribute("data-state", "empty");
  await expect(block(page, "past-bookings")).toHaveAttribute("data-state", "empty");
  await page.goto("/en/account/bookings");
  await expect(page.getByText("You have no bookings yet")).toBeVisible();
  await shot(page, "1440-en-account-fresh.png", info.outputPath.bind(info));
});

test("after withdrawing health data consent, privacy and export still work; the other pages ask for it again", async ({ page }) => {
  await signIn(page, unique("withdrawn"));
  await page.goto("/en/account/privacy");
  await page.locator('[data-consent="health_data"]').getByRole("button", { name: "Withdraw" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Withdraw consent" }).click();
  await expect(page.locator('[data-consent="health_data"]').getByText("Not given")).toBeVisible();

  // A fresh load of the privacy page: no detour to the consent step.
  await page.goto("/en/account/privacy");
  await expect(page).toHaveURL(/\/en\/account\/privacy$/);
  await expect(heading(page)).toHaveText("Privacy");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download my data" }).click();
  expect((await download).suggestedFilename()).toMatch(/^jakamarinko-data-\d{4}-\d{2}-\d{2}\.zip$/);
  await page.goto("/en/account/privacy/delete?token=x");
  await expect(heading(page)).toHaveText("Delete your account");

  // The rest of the account still needs the consent, also when reached from the privacy page's menu.
  await page.goto("/en/account/privacy");
  await page.getByRole("link", { name: "My bookings" }).first().click();
  await expect(page).toHaveURL(/\/en\/consent\?next=%2Faccount%2Fbookings$/);
  await page.goto("/en/account/profile");
  await expect(page).toHaveURL(/\/en\/consent\?next=%2Faccount%2Fprofile$/);
});

test("a deletion link opened while signed out survives the sign-in, token included", async ({ page }) => {
  const email = unique("signedout");
  await signIn(page, email);
  const since = fileStamp();
  expect((await page.request.post("/api/account/delete")).ok()).toBe(true);
  const link = await linkFrom("/account/privacy/delete?token=", since);
  const path = new URL(link).pathname + new URL(link).search;

  await page.context().clearCookies({ name: "better-auth.session_token" });
  await page.goto(link);
  await expect(page).toHaveURL(`/en/sign-in?next=${encodeURIComponent(path.replace(/^\/en/, ""))}`);
  await page.locator("#email").fill(email);
  const sent = fileStamp();
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  await page.goto(await linkFrom(email, sent));
  await expect(page).toHaveURL(path);
  await expect(heading(page)).toHaveText("Delete your account");
  await page.getByRole("button", { name: "Delete my account for good" }).click();
  await expect(page.getByRole("heading", { name: "Your account is deleted" })).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("overview and bookings fit the screen", async ({ page }, info) => {
    const email = unique("phone");
    await bookAsGuest(page, email);
    await signIn(page, email);
    for (const [p, name] of [
      ["/en/account", "375-en-account-overview.png"],
      ["/sl/account/bookings", "375-sl-account-bookings.png"],
      ["/en/account/privacy", "375-en-account-privacy.png"],
    ] as const) {
      await page.goto(p);
      await expect(heading(page)).toBeVisible();
      await expect(page.locator('[data-state="loading"]:visible')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
      await shot(page, name, info.outputPath.bind(info));
    }
  });
});
