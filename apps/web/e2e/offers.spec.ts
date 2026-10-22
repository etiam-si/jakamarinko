import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import { serializeConsent } from "../src/lib/consent";
import enOffers from "../messages/en/offers.json";
import slOffers from "../messages/sl/offers.json";

// US-012: free tests, codes at the review, referrals, the founding counter and gift vouchers. Payments off (pay on site).
const outbox = path.join(__dirname, "../../api/.emails");
const unique = (name: string) => `offers-e2e-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
const coachEmail = "offers-e2e-coach@example.com";

const consentCookie = (baseURL: string) => ({
  name: "jm_consent",
  value: encodeURIComponent(serializeConsent({ analytics: false, marketing: false })),
  url: baseURL,
});

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([consentCookie(baseURL!)]);
});

async function sql<T extends object = Record<string, unknown>>(query: string, values: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54320/postgres" });
  await client.connect();
  try {
    return (await client.query<T>(query, values)).rows;
  } finally {
    await client.end();
  }
}

// Its own coach, free every day 07:00–21:00, with an empty calendar on every run.
test.beforeAll(async () => {
  const [user] = await sql<{ id: string }>(
    `insert into users (id, name, email, email_verified, role) values (gen_random_uuid()::text, 'Offers Coach', $1, true, 'coach')
     on conflict (email) do update set role = 'coach' returning id`,
    [coachEmail],
  );
  await sql("insert into coaches (user_id) values ($1) on conflict (user_id) do nothing", [user!.id]);
  const [coach] = await sql<{ id: string }>("select id from coaches where user_id = $1", [user!.id]);
  let [lab] = await sql<{ id: string }>("select id from locations where is_default");
  if (!lab) [lab] = await sql<{ id: string }>("insert into locations (name, address, is_default) values ('Lab', 'Testna ulica 1, Ljubljana', true) returning id");
  await sql("delete from offer_redemptions where booking_id in (select id from bookings where coach_id = $1)", [coach!.id]);
  await sql("update offer_codes set booking_id = null where booking_id in (select id from bookings where coach_id = $1)", [coach!.id]);
  await sql("update founding_athletes set booking_id = null where booking_id in (select id from bookings where coach_id = $1)", [coach!.id]);
  await sql("delete from bookings where coach_id = $1", [coach!.id]);
  // Earlier runs' customers don't use up the 20 places.
  await sql("delete from founding_athletes where email like 'offers-e2e-%'");
  const [any] = await sql("select 1 from availability where coach_id = $1", [coach!.id]);
  if (!any) {
    for (let weekday = 1; weekday <= 7; weekday++) {
      await sql(`insert into availability (coach_id, weekday, start, "end", location_id) values ($1, $2, '07:00', '21:00', $3)`, [coach!.id, weekday, lab!.id]);
    }
  }
  // SPRING20: the seeded 20 % code.
  await sql(
    `insert into offer_codes (code, kind, discount_type, value) values ('SPRING20', 'promo', 'percent', 20)
     on conflict (code) do update set active = true, discount_type = 'percent', value = 20, services = null, max_uses = null, expires_at = null, email = null`,
  );
  await sql("insert into offer_settings (id, founding_enabled) values (1, true) on conflict (id) do update set founding_enabled = true");
});

// The newest email whose html contains `needle`, and its first link.
async function emailWith(needle: string) {
  let found: { html: string; link: string } | undefined;
  await expect
    .poll(async () => {
      const files = (await readdir(outbox).catch(() => [])).filter((f) => f.endsWith(".html")).sort().reverse();
      for (const file of files) {
        const html = await readFile(path.join(outbox, file), "utf8");
        if (html.includes(needle)) return (found = { html, link: /href="([^"]+)"/.exec(html)![1]!.replaceAll("&amp;", "&") });
      }
    })
    .toBeTruthy();
  return found!;
}

// A fresh account with that role (magic link, health data consent), the way landing.spec.ts signs in.
async function signIn(page: Page, email: string, role?: "owner" | "customer") {
  await page.goto("/en/sign-in");
  await page.locator("#email").fill(email);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  await page.goto((await emailWith(email)).link);
  await expect(page).toHaveURL(/\/en\/consent/);
  expect((await page.request.post("/api/auth/consents", { data: { kind: "health_data", granted: true } })).ok()).toBe(true);
  if (role) await sql("update users set role = $1 where email = $2", [role, email]);
}

async function ownerPage(browser: Browser, baseURL: string) {
  const context = await browser.newContext({ baseURL });
  await context.addCookies([consentCookie(baseURL)]);
  const page = await context.newPage();
  await signIn(page, unique("owner"), "owner");
  return page;
}

// Booking steps: a random free time on the first free day (not the first one, which booking.spec.ts takes, so the
// specs running side by side don't race for it), then the details with every health answer "No".
async function pickTime(page: Page) {
  await expect(page.locator("#booking-step")).toHaveText("Pick a date and time");
  const times = page.locator('input[name="time"]');
  await expect(times.first()).toBeAttached();
  const count = await times.count();
  await times.nth(Math.min(count - 1, 4 + Math.floor(Math.random() * Math.max(1, count - 4)))).check({ force: true });
  await page.getByRole("button", { name: "Continue" }).click();
}

async function fillDetails(page: Page, email: string) {
  await expect(page.locator("#booking-step")).toHaveText("Your details");
  await page.getByLabel("Full name").fill("Ana Novak");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone", { exact: true }).fill("+386 40 123 456");
  const questions = page.locator("fieldset fieldset");
  for (let i = 0; i < (await questions.count()); i++) await questions.nth(i).getByRole("radio", { name: "No", exact: true }).check();
  await page.getByRole("checkbox", { name: /health questions are processed/ }).check();
  await page.getByRole("checkbox", { name: /I accept the/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#booking-step")).toHaveText("Check and confirm");
}

// A guest booking of the e2e coach's first free lactate profile, through the api like the booking page.
async function bookViaApi(page: Page, email: string, code?: string) {
  const [coach] = await sql<{ id: string }>("select c.id from coaches c join users u on u.id = c.user_id where u.email = $1", [coachEmail]);
  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
  const slots = (await (await page.request.get(`/api/booking/slots?service=lactate-profile&from=${day(3)}&to=${day(30)}`)).json()) as {
    coachId: string;
    start: string;
  }[];
  const mine = slots.filter((s) => s.coachId === coach!.id);
  const slot = mine[Math.floor(Math.random() * mine.length)]!;
  const res = await page.request.post("/api/booking", {
    data: { service: "lactate-profile", coachId: slot.coachId, start: slot.start, name: "Friend", email, phone: "+386 41 000 000", locale: "en", code },
  });
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()).booking as { id: string; priceCents: number };
}

test("the owner gives Ana a free test: email with the code, pre-filled at review, 0 €, booked with nothing to pay", async ({ page, browser, baseURL }) => {
  test.setTimeout(120_000);
  const owner = await ownerPage(browser, baseURL!);
  const email = unique("ana");
  await owner.goto("/en/coach");
  await owner.getByRole("link", { name: "Offers" }).first().click();
  await expect(owner).toHaveURL(/\/en\/coach\/offers/);
  const form = owner.locator("form").filter({ has: owner.getByRole("button", { name: "Send the free test" }) });
  await form.getByLabel("Name").fill("Ana");
  await form.getByLabel("Email", { exact: true }).fill(email);
  await form.getByLabel("Test").selectOption("lactate-profile");
  await form.getByLabel("Email language").selectOption("en");
  await form.getByRole("button", { name: "Send the free test" }).click();
  await expect(owner.getByText(`Free test sent to ${email}.`)).toBeVisible();

  const [code] = await sql<{ code: string }>("select code from offer_codes where kind = 'free_test' and email = $1", [email]);
  const mail = await emailWith(code!.code);
  expect(mail.html).toContain("Hi Ana,");
  expect(mail.link).toContain(`code=${code!.code}`);
  expect(new URL(mail.link).pathname).toBe("/en/booking");

  await page.goto(mail.link);
  await pickTime(page);
  await fillDetails(page, email);
  await expect(page.getByLabel("Offer or voucher code")).toHaveValue(code!.code);
  await expect(page.getByTestId("offer-new-price")).toHaveText("€0");
  await expect(page.getByTestId("offer-price").locator("s")).toContainText("€90");
  await expect(page.getByText("Nothing to pay.")).toBeVisible();
  await page.getByRole("button", { name: "Confirm booking" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You're booked");
  await expect(page.getByTestId("pay-on-site")).toHaveText("There is nothing to pay.");
  const id = new URL(page.url()).pathname.split("/").pop();
  const [redemption] = await sql("select paid_cents, saved_cents from offer_redemptions where booking_id = $1", [id]);
  expect(redemption).toEqual({ paid_cents: 0, saved_cents: 9000 });
  await owner.context().close();
});

test("SPRING20 at the review shows the old price struck through and the new one; a bad code an inline error; 44 px at 390", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/booking?service=lactate-profile");
  await pickTime(page);
  await fillDetails(page, unique("spring"));

  const field = page.getByLabel("Offer or voucher code");
  const apply = page.getByRole("button", { name: "Apply" });
  for (const box of [await field.boundingBox(), await apply.boundingBox()]) {
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  expect(await field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);

  await field.fill("NOPE-1234");
  await apply.click();
  await expect(page.getByRole("alert").filter({ hasText: "We don't know this code" })).toBeVisible();
  await expect(field).toHaveAttribute("aria-invalid", "true");

  await field.fill("spring20");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("Code SPRING20 applied.")).toBeVisible();
  await expect(page.getByTestId("offer-price").locator("s")).toHaveText("Was €90");
  await expect(page.getByTestId("offer-new-price")).toHaveText("€72");
  const { violations } = await new AxeBuilder({ page }).include("[data-testid=offer]").analyze();
  expect(violations.map((v) => v.id)).toEqual([]);

  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You're booked");
  await expect(page.getByTestId("pay-on-site")).toHaveText("You pay €72 on site, on the day.");
});

test("a signed-in customer copies their referral link; once a friend's booking is completed, the 10 € credit is listed", async ({
  page,
  context,
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const email = unique("referrer");
  await signIn(page, email);
  await page.goto("/en/account");
  const block = page.locator('[data-block="referral"]:visible');
  await expect(block.getByRole("heading", { name: "Invite a friend" })).toBeVisible();
  const link = await block.getByLabel("Your personal link").inputValue();
  expect(link).toMatch(/\/en\/r\/[A-Z0-9]{8}$/);
  await block.getByRole("button", { name: "Copy link" }).click();
  await expect(block.getByRole("button", { name: "Copied" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(link);
  expect(copied).toContain("/r/");
  await expect(block.getByText("No credits yet.")).toBeVisible();

  // The friend opens the link (not indexed) and books with 10 € off.
  const invite = await page.request.get(new URL(link).pathname);
  expect(await invite.text()).toMatch(/<meta name="robots" content="noindex, nofollow"/);
  const code = link.split("/r/")[1]!;
  const friend = await bookViaApi(page, unique("friend"), code);
  expect(friend.priceCents).toBe(8000);

  // The coach marks it completed once it has happened.
  await sql("update bookings set start_at = now() - interval '2 hours', end_at = now() - interval '1 hour' where id = $1", [friend.id]);
  const owner = await ownerPage(browser, baseURL!);
  const done = await owner.request.post(`/api/booking/coach/bookings/${friend.id}/outcome`, { data: { status: "completed" } });
  expect(done.status(), await done.text()).toBe(200);
  await owner.context().close();

  await page.reload();
  const credits = page.locator('[data-block="referral"]:visible').getByTestId("referral-credits");
  await expect(credits).toContainText("€10 credit");
  await expect(credits).toContainText(/CR-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  const creditCode = /CR-[A-Z0-9]{4}-[A-Z0-9]{4}/.exec((await credits.textContent())!)![0];
  expect((await emailWith(creditCode)).link).toContain(`code=${creditCode}`);
});

test("/en and /en/lab show the founding places left from the database; switched off, the text is gone; SL too", async ({ page }) => {
  const left = async () => 20 - Number((await sql<{ n: string }>("select count(*) as n from founding_athletes"))[0]!.n);
  const counter = page.getByTestId("founding-counter");

  for (const path of ["/en", "/en/lab"]) {
    await page.goto(path);
    await expect(counter).toContainText(`${await left()} of 20 founding places left`);
  }
  // One more founding athlete: the counter follows the database.
  const [{ n }] = (await sql<{ n: number }>("select coalesce(max(number), 0) + 1 as n from founding_athletes")) as [{ n: number }];
  await sql("insert into founding_athletes (email, number) values ($1, $2)", [unique("founder"), n]);
  await page.goto("/en");
  await expect(counter).toContainText(`${await left()} of 20 founding places left`);
  await page.goto("/sl/lab");
  await expect(counter).toContainText(`Prostih je še ${await left()} od 20 ustanovnih mest`);

  await sql("update offer_settings set founding_enabled = false where id = 1");
  try {
    for (const path of ["/en", "/en/lab"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(/founding places left/)).toHaveCount(0);
    }
  } finally {
    await sql("update offer_settings set founding_enabled = true where id = 1");
  }
});

test("a gift voucher page shows the value and the service, books with the code filled in, and isn't indexed", async ({ page }) => {
  const code = `GIFT-E2E-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  await sql(
    `insert into offer_codes (code, kind, discount_type, services, max_uses, recipient_name, expires_at)
     values ($1, 'gift', 'free', '{lactate-profile}', 1, 'Maja', now() + interval '1 year')`,
    [code],
  );
  await page.goto(`/en/gift/${code}`);
  await expect(page.getByTestId("gift-value")).toHaveText("For one Lactate profile");
  await expect(page.getByText("Worth €90")).toBeVisible();
  await expect(page.getByText("For Maja")).toBeVisible();
  await expect(page.getByTestId("gift-code")).toHaveText(code);
  const book = page.getByRole("link", { name: "Book with this voucher" });
  expect(new URL((await book.getAttribute("href"))!, "http://x").searchParams.get("code")).toBe(code);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);

  await book.click();
  await pickTime(page);
  await fillDetails(page, unique("gift"));
  await expect(page.getByLabel("Offer or voucher code")).toHaveValue(code);
  await expect(page.getByTestId("offer-new-price")).toHaveText("€0");

  await page.goto(`/sl/gift/${code}`);
  await expect(page.getByRole("link", { name: "Rezerviraj s tem bonom" })).toBeVisible();
  // Without online payment, buying a voucher means getting in touch.
  await page.goto("/en/gift");
  await expect(page.getByTestId("gift-contact")).toHaveText("To buy a gift voucher, get in touch with Jaka and he'll prepare one for you.");
});

test("every offers text exists in English and Slovenian", () => {
  const keys = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`]));
  expect(keys(slOffers).sort()).toEqual(keys(enOffers).sort());
  for (const value of keys(slOffers)) expect(value.length).toBeGreaterThan(0);
});
