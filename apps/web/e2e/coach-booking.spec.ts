import { randomBytes } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { Client } from "pg";
import { Slot } from "@jakamarinko/api";
import type { Role } from "@jakamarinko/types";
import { serializeConsent } from "../src/lib/consent";

test.beforeEach(async ({ context, baseURL }) => {
  const value = encodeURIComponent(serializeConsent({ analytics: false, marketing: false }));
  await context.addCookies([{ name: "jm_consent", value, url: baseURL! }]);
});

const outbox = path.join(__dirname, "../../api/.emails");
const unique = (name: string) => `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

async function sql<T = Record<string, unknown>>(text: string, values: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54320/postgres" });
  await client.connect();
  try {
    return (await client.query(text, values)).rows as T[];
  } finally {
    await client.end();
  }
}

// The newest email in the dev outbox whose body contains all of `needles`, with its attachments' file prefix.
async function findEmail(...needles: string[]) {
  let found: { html: string; prefix: string } | undefined;
  await expect
    .poll(async () => {
      const files = (await readdir(outbox).catch(() => [])).filter((f) => f.endsWith(".html")).sort().reverse();
      for (const file of files) {
        const html = await readFile(path.join(outbox, file), "utf8");
        if (needles.every((n) => html.includes(n))) return (found = { html, prefix: path.join(outbox, file.replace(/\.html$/, "")) });
      }
    })
    .toBeTruthy();
  return found!;
}

// Signed in, past the consent step, with the role set in this worktree's database (no admin screen gives roles yet).
async function signInAs(page: Page, role: Role) {
  const email = `${unique(role)}@example.com`;
  await page.goto("/en/sign-in");
  await page.locator("#email").fill(email);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  const { html } = await findEmail(email);
  await page.goto(/href="([^"]+)"/.exec(html)![1]!.replaceAll("&amp;", "&"));
  await expect(page).toHaveURL(/\/en\/consent/);
  expect((await page.request.post("/api/auth/consents", { data: { kind: "health_data", granted: true } })).ok()).toBe(true);
  await sql("update users set role = $1 where email = $2", [role, email]);
  return email;
}

// A calendar for that user: open every day 08:00–20:00 at the default location (created when the database has none).
async function makeCoach(email: string) {
  await sql(`insert into locations (name, address, is_default) select 'Lab', 'Testna 1, Ljubljana', true
             where not exists (select 1 from locations where is_default)`);
  const [coach] = await sql<{ id: string }>(
    "insert into coaches (user_id) select id from users where email = $1 returning id",
    [email],
  );
  await sql(
    `insert into availability (coach_id, weekday, start, "end", location_id)
     select $1, d, '08:00', '20:00', (select id from locations where is_default) from generate_series(1, 7) d`,
    [coach!.id],
  );
  return coach!.id;
}

// Ljubljana dates, as the screens show them.
const ljubljanaDate = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Ljubljana" }).format(date);
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const weekday = (date: string) => ((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00Z`));
const today = () => ljubljanaDate(new Date());

type NewBooking = {
  coachId: string;
  day: string;
  time: string;
  name: string;
  email?: string;
  service?: string;
  health?: Record<string, boolean | string>;
};

// Straight into the database, so a booking can be today (the public flow needs 24 h notice).
async function insertBooking({ coachId, day, time, name, email = `${name.toLowerCase()}@example.com`, service = "vo2max", health }: NewBooking) {
  const [row] = await sql<{ id: string }>(
    `insert into bookings (service_type_id, coach_id, location_id, customer_name, customer_email, customer_phone,
       start_at, end_at, status, locale, health_answers, health_consent_at, manage_token)
     select s.id, $1, (select id from locations where is_default), $2, $3, '+386 41 000 000',
       ($4::date + $5::time) at time zone 'Europe/Ljubljana',
       ($4::date + $5::time) at time zone 'Europe/Ljubljana' + make_interval(mins => s.duration_min),
       'confirmed', 'en', $6::jsonb, case when $6::jsonb is null then null else now() end, $7
     from service_types s where s.catalog_id = $8
     returning id`,
    [coachId, name, email, day, time, health ? JSON.stringify(health) : null, randomBytes(24).toString("base64url"), service],
  );
  return row!.id;
}

async function coachSlots(page: Page, coachId: string, day: string) {
  const res = await page.request.get(`/api/booking/slots?service=vo2max&from=${day}&to=${day}`);
  expect(res.ok()).toBe(true);
  return Slot.array().parse(await res.json()).filter((s) => s.coachId === coachId);
}

const notice = (page: Page) => page.locator("[data-notice]");

// How the booking form asked the chest pain question (messages/*/booking.json), which the coach sees too.
const chestPain = { en: "Do you feel pain in your chest", sl: "Čutiš bolečino v prsih" };

const noSideScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);

// For the PR: only when COACH_SCREENSHOTS names a folder.
const shot = async (page: Page, name: string) => {
  await noSideScroll(page);
  if (process.env.COACH_SCREENSHOTS) await page.screenshot({ path: path.join(process.env.COACH_SCREENSHOTS, name), fullPage: true });
};

test("the coach closes next Monday with an exception, and the public flow has no slots that day", async ({ page }) => {
  const coachId = await makeCoach(await signInAs(page, "coach"));
  // The first Monday at least two days away, so the 24 h notice leaves its slots bookable.
  let monday = addDays(today(), 2);
  while (weekday(monday) !== 1) monday = addDays(monday, 1);
  expect((await coachSlots(page, coachId, monday)).length).toBeGreaterThan(0);

  await page.goto("/en/coach/settings/availability");
  await expect(page.getByRole("heading", { name: "Holidays and extra days" })).toBeVisible();
  const [y, m, d] = monday.split("-").map(Number);
  const button = page.locator(`button[data-day="${new Date(y!, m! - 1, d!).toLocaleDateString("en-GB")}"]`);
  if (!(await button.isVisible())) await page.locator(".rdp-button_next").click();
  await button.click();
  await expect(page.getByText(`Selected: ${dayLabel(monday)}`)).toBeVisible();
  await page.getByLabel("Closed all day").check();
  await page.getByLabel("Note (only you see it)").fill("Race");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(notice(page)).toHaveText("Added.");
  await expect(page.getByRole("listitem").filter({ hasText: dayLabel(monday) })).toContainText("Closed · Race");

  expect(await coachSlots(page, coachId, monday)).toEqual([]);
  expect((await coachSlots(page, coachId, addDays(monday, 1))).length).toBeGreaterThan(0);
});

test("the coach moves a booking, and the customer gets a rescheduled email with the new time and .ics", async ({ page }) => {
  const coachId = await makeCoach(await signInAs(page, "coach"));
  const day = addDays(today(), 3);
  const name = unique("Ana");
  const id = await insertBooking({ coachId, day, time: "10:00", name });

  await page.goto("/en/coach/bookings");
  await page.getByRole("button", { name: "List" }).click();
  const card = page.getByRole("article", { name: `10:00 ${name}` });
  await card.getByRole("button", { name: "Move" }).click();
  const dialog = page.getByRole("dialog", { name: "Move this booking" });
  await dialog.getByRole("group", { name: dayLabel(day) }).getByRole("button", { name: "14:00" }).click();
  await dialog.getByRole("button", { name: `Move to ${dayLabel(day)}, 14:00` }).click();
  await expect(notice(page)).toHaveText(`Booking moved. ${name} has been emailed.`);
  await expect(page.getByRole("article", { name: `14:00 ${name}` })).toBeVisible();

  const email = await findEmail(`Hi ${name},`, "moved to a new time");
  expect(email.html).toContain(`${dayLabel(day)}, 14:00`);
  expect(email.html).toContain(`Previous time: ${dayLabel(day)}, 10:00`);
  const ics = await readFile(`${email.prefix}-booking.ics`, "utf8");
  expect(ics).toContain(`UID:${id}@jakamarinko.com`);
  expect(ics).toContain(`DTSTART;TZID=Europe/Ljubljana:${day.replaceAll("-", "")}T140000`);
  expect(ics).toMatch(/SEQUENCE:[1-9]\d*\r\n/);
});

test("a head coach on another coach's calendar (?coach=) sees the health flag, not the answers", async ({ page, browser }) => {
  const other = await browser.newPage();
  const otherId = await makeCoach(await signInAs(other, "coach"));
  await other.close();
  await signInAs(page, "head_coach");
  const name = unique("Bo");
  await insertBooking({ coachId: otherId, day: addDays(today(), 1), time: "09:00", name, health: { chest_pain: true } });

  await page.goto(`/en/coach?coach=${otherId}`);
  const card = page.getByRole("article", { name: `09:00 ${name}` });
  await expect(card.getByText("Health: check answers")).toBeVisible();
  await card.getByRole("button", { name: "Details" }).click();
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog.getByText("Only the coach of this booking sees the answers.")).toBeVisible();
  await expect(dialog.getByText(chestPain.en)).toHaveCount(0);
});

test("a booking whose customer deleted their account shows Deleted user, without call or email", async ({ page }) => {
  const coachId = await makeCoach(await signInAs(page, "coach"));
  await insertBooking({ coachId, day: today(), time: "06:15", name: "", email: "" });
  for (const [locale, label] of [["en", "Deleted user"], ["sl", "Izbrisan uporabnik"]] as const) {
    await page.goto(`/${locale}/coach`);
    const card = page.getByRole("article", { name: `06:15 ${label}` });
    await expect(card.getByText(label)).toBeVisible();
    await expect(card.getByRole("link", { name: locale === "en" ? "Call" : "Pokliči" })).toHaveCount(0);
  }
});

test("the head coach switches calendars by coach id, and sees the other coach's bookings", async ({ page, browser }) => {
  const other = await browser.newPage();
  const otherEmail = await signInAs(other, "coach");
  await other.close();
  const otherName = unique("Maja");
  await sql("update users set name = $1 where email = $2", [otherName, otherEmail]);
  const otherId = await makeCoach(otherEmail);
  await makeCoach(await signInAs(page, "head_coach"));
  const name = unique("Ana");
  await insertBooking({ coachId: otherId, day: today(), time: "06:30", name });

  await page.goto("/en/coach");
  await page.getByRole("combobox", { name: "Calendar of" }).click();
  await page.getByRole("option", { name: otherName }).click();
  await expect(page).toHaveURL(`/en/coach?coach=${otherId}`);
  await expect(page.getByRole("article", { name: `06:30 ${name}` })).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("every coach booking screen works at 375 px, in both languages", async ({ page }) => {
    const coachId = await makeCoach(await signInAs(page, "coach"));
    const day = today();
    const names = [unique("Ana"), unique("Luka"), unique("Maja")] as const;
    await insertBooking({ coachId, day, time: "07:00", name: names[0], health: { chest_pain: true, heart_condition: false, medication: "Ventolin" } });
    await insertBooking({ coachId, day, time: "19:00", name: names[1], service: "performance" });
    await insertBooking({ coachId, day: addDays(day, 1), time: "16:30", name: names[2], service: "personal-training" });

    for (const locale of ["en", "sl"] as const) {
      await page.goto(`/${locale}/coach`);
      await expect(page.getByRole("article")).toHaveCount(3);
      await shot(page, `375-${locale}-today.png`);

      await page.getByRole("article").first().getByRole("button", { name: locale === "en" ? "Details" : "Podrobnosti" }).click();
      await expect(page.getByRole("dialog")).toContainText(chestPain[locale]);
      await expect(page.getByRole("dialog")).not.toContainText("chest pain", { ignoreCase: true });
      await shot(page, `375-${locale}-booking-details.png`);
      await page.keyboard.press("Escape");

      await page.goto(`/${locale}/coach/bookings`);
      await expect(page.getByRole("button", { name: locale === "en" ? "Week" : "Teden", exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByRole("button", { name: names[0] })).toBeVisible();
      await shot(page, `375-${locale}-bookings-week.png`);
      await page.getByRole("button", { name: locale === "en" ? "List" : "Seznam" }).click();
      await expect(page.getByRole("article").first()).toBeVisible();
      await shot(page, `375-${locale}-bookings-list.png`);

      await page.getByRole("article").last().getByRole("button", { name: locale === "en" ? "Move" : "Prestavi" }).click();
      await expect(page.getByRole("dialog").getByRole("button").nth(3)).toBeVisible();
      await shot(page, `375-${locale}-reschedule.png`);
      await page.keyboard.press("Escape");
      await page.getByRole("article").last().getByRole("button", { name: locale === "en" ? "Cancel" : "Odpovej" }).click();
      await shot(page, `375-${locale}-cancel.png`);
      await page.keyboard.press("Escape");

      await page.goto(`/${locale}/coach/settings`);
      await shot(page, `375-${locale}-settings.png`);
      await page.goto(`/${locale}/coach/settings/availability`);
      await expect(page.locator("input[type=time]").first()).toBeVisible();
      await shot(page, `375-${locale}-availability.png`);
    }
  });
});
