import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import type { Locale } from "@jakamarinko/types";
import { addDays, formatDate, formatDay, localDay } from "../src/components/booking/time";
import { serializeConsent } from "../src/lib/consent";

test.use({ viewport: { width: 375, height: 812 } });

const consentCookie = (baseURL: string) => ({
  name: "jm_consent",
  value: encodeURIComponent(serializeConsent({ analytics: false, marketing: false })),
  url: baseURL,
});

// A cookie choice is already made, so the cookie banner doesn't cover the steps.
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([consentCookie(baseURL!)]);
});

const sql = async <T extends object>(query: string, params: unknown[] = []) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54320/postgres" });
  await client.connect();
  try {
    return (await client.query<T>(query, params)).rows;
  } finally {
    await client.end();
  }
};

// A coach free every day 07:00–21:00, so there are slots whatever day the tests run (CI has no seeded head coach).
test.beforeAll(async () => {
  const [user] = await sql<{ id: string }>(
    `insert into users (id, name, email, email_verified, role) values (gen_random_uuid()::text, 'E2E Coach', 'booking-e2e-coach@example.com', true, 'coach')
     on conflict (email) do update set role = 'coach' returning id`,
  );
  await sql("insert into coaches (user_id) values ($1) on conflict (user_id) do nothing", [user!.id]);
  const [coach] = await sql<{ id: string }>("select id from coaches where user_id = $1", [user!.id]);
  let [lab] = await sql<{ id: string }>("select id from locations where is_default");
  if (!lab) [lab] = await sql<{ id: string }>("insert into locations (name, address, is_default) values ('Lab', 'Testna ulica 1, Ljubljana', true) returning id");
  const [any] = await sql("select 1 from availability where coach_id = $1", [coach!.id]);
  // Its calendar starts empty on every run, so runs on a local database don't use up the free times.
  await sql("delete from bookings where coach_id = $1", [coach!.id]);
  if (!any) {
    for (let weekday = 1; weekday <= 7; weekday++) {
      await sql("insert into availability (coach_id, weekday, start, \"end\", location_id) values ($1, $2, '07:00', '21:00', $3)", [coach!.id, weekday, lab!.id]);
    }
  }
});

// The api runs from apps/api, so its dev email transport writes to apps/api/.emails.
const outbox = path.join(__dirname, "../../api/.emails");
const unique = (name: string) => `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
const shot = (page: Page, name: string) =>
  process.env.BOOKING_SCREENSHOTS ? page.screenshot({ path: path.join(process.env.BOOKING_SCREENSHOTS, name), fullPage: true }) : undefined;

async function noAxeViolations(page: Page) {
  // After a client-side step change Next sets the title a moment later.
  await expect(page).toHaveTitle(/\S/);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
}

// The confirmation email of a booking (the one with the .ics, its manage link names the booking): html and calendar file.
async function confirmationEmail(bookingId: string) {
  let found: { html: string; ics: string } | undefined;
  await expect
    .poll(async () => {
      for (const file of (await readdir(outbox).catch(() => [])).filter((f) => f.endsWith(".html"))) {
        const html = await readFile(path.join(outbox, file), "utf8");
        const ics = path.join(outbox, file.replace(/\.html$/, "-booking.ics"));
        if (html.includes(`/booking/${bookingId}?`) && existsSync(ics)) return (found = { html, ics: await readFile(ics, "utf8") });
      }
    })
    .toBeTruthy();
  return found!;
}

// "20261026T160000" from DTSTART;TZID=Europe/Ljubljana as "2026-10-26 16:00".
function icsStart(ics: string) {
  const m = /DTSTART;TZID=Europe\/Ljubljana:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/.exec(ics);
  return m && `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
}

const text = {
  en: { time: "Pick a date and time", details: "Your details", review: "Check and confirm", booked: "You're booked", next: "Continue", confirm: "Confirm booking", name: "Full name", email: "Email", phone: "Phone", no: "No", yes: "Yes", consent: /health questions are processed/, terms: /I accept the/, doctor: /talk to your doctor/ },
  sl: { time: "Izberi datum in uro", details: "Tvoji podatki", review: "Preveri in potrdi", booked: "Rezervacija je potrjena", next: "Naprej", confirm: "Potrdi rezervacijo", name: "Ime in priimek", email: "E-pošta", phone: "Telefon", no: "Ne", yes: "Da", consent: /zdravstvena vprašanja obdelujejo/, terms: /Sprejemam/, doctor: /posvetuj z zdravnikom/ },
} as const;

const stepHeading = (page: Page) => page.locator("#booking-step");

// The booking's id from the confirmation page's url.
const bookingId = (page: Page) => new URL(page.url()).pathname.split("/").pop()!;

// Picks a day (the first one with free times unless given) and its first time; returns the time's label.
async function pickTime(page: Page, locale: Locale, day?: string, nth = 0) {
  await expect(stepHeading(page)).toHaveText(text[locale].time);
  if (day) {
    const more = page.getByRole("button", { name: locale === "en" ? "Show more dates" : "Pokaži več datumov" });
    if (await more.isVisible()) await more.click();
    await page.getByRole("radio", { name: formatDay(day, locale), exact: true }).check({ force: true });
  }
  const time = page.locator('input[name="time"]').nth(nth);
  await time.check({ force: true });
  const label = await page.locator('label:has(input[name="time"])').nth(nth).innerText();
  await page.getByRole("button", { name: text[locale].next }).click();
  return label.trim();
}

async function fillDetails(page: Page, locale: Locale, person: { name: string; email: string; phone: string }, yesTo?: number) {
  const t = text[locale];
  await expect(stepHeading(page)).toHaveText(t.details);
  await page.getByLabel(t.name).fill(person.name);
  await page.getByLabel(t.email, { exact: true }).fill(person.email);
  await page.getByLabel(t.phone, { exact: true }).fill(person.phone);
  const questions = page.locator("fieldset fieldset");
  for (let i = 0; i < (await questions.count()); i++) {
    await questions.nth(i).getByRole("radio", { name: i === yesTo ? t.yes : t.no, exact: true }).check();
  }
  await page.getByRole("checkbox", { name: t.consent }).check();
  await page.getByRole("checkbox", { name: t.terms }).check();
}

for (const locale of ["en", "sl"] as const) {
  test(`${locale}: a guest books the Performance package and gets the confirmation email in ${locale}`, async ({ page }) => {
    const t = text[locale];
    const email = unique(`guest-${locale}`);
    await page.goto(`/${locale}/booking?service=performance`);
    // Preselected from ?service=: straight to the date and time.
    await expect(stepHeading(page)).toHaveText(t.time);
    await expect(page.locator("[aria-current=step]")).toHaveText(locale === "en" ? "2Date and time" : "2Datum in ura");
    await noAxeViolations(page);
    await shot(page, `375-${locale}-2-time.png`);

    // The service step, reached from "Change", is checked too; back keeps the service.
    await page.getByRole("button", { name: locale === "en" ? "Change" : "Spremeni" }).click();
    await expect(page.getByRole("radio", { name: /Performance/ })).toBeChecked();
    await noAxeViolations(page);
    await shot(page, `375-${locale}-1-service.png`);
    await page.goBack();

    const time = await pickTime(page, locale);
    await expect(stepHeading(page)).toHaveText(t.details);
    // Continue with nothing filled in: every problem is named, then fixed.
    await page.getByRole("button", { name: t.next }).click();
    await expect(page.getByLabel(t.name)).toBeFocused();
    await noAxeViolations(page);
    await fillDetails(page, locale, { name: "Ana Novak", email, phone: "+386 40 123 456" }, locale === "sl" ? 0 : undefined);
    if (locale === "sl") await expect(page.getByText(t.doctor)).toBeVisible();
    await noAxeViolations(page);
    await shot(page, `375-${locale}-3-details.png`);
    await page.getByRole("button", { name: t.next }).click();

    await expect(stepHeading(page)).toHaveText(t.review);
    // A "yes" (Slovenian run) shows the doctor note again and still lets them confirm.
    if (locale === "sl") await expect(page.getByText(t.doctor)).toBeVisible();
    const when = await page.getByTestId("review-when").innerText();
    expect(when).toContain(time);
    await noAxeViolations(page);
    await shot(page, `375-${locale}-4-review.png`);
    await page.getByRole("button", { name: t.confirm }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.booked);
    await expect(page).toHaveURL(new RegExp(`/${locale}/booking/[0-9a-f-]+\\?token=.+&confirmed=1$`));
    await expect(page.getByTestId("booking-when")).toHaveText(when);
    await noAxeViolations(page);
    await shot(page, `375-${locale}-5-confirmed.png`);

    const mail = await confirmationEmail(bookingId(page));
    expect(mail.html).toContain(`lang="${locale}"`);
    expect(mail.html).toContain(locale === "en" ? "Your booking is confirmed" : "Tvoja rezervacija je potrjena");
    expect(mail.html).toContain(when);
  });
}

test("time shown = time in the email = time in the .ics, on a date across the DST change", async ({ page }) => {
  // The first day after the next change of Ljubljana's UTC offset, if the booking window (60 days) reaches it.
  const today = localDay(new Date());
  const offset = (day: string) =>
    new Intl.DateTimeFormat("en", { timeZone: "Europe/Ljubljana", timeZoneName: "shortOffset" })
      .formatToParts(new Date(`${day}T12:00:00Z`))
      .find((p) => p.type === "timeZoneName")!.value;
  let day = addDays(today, 2);
  for (let d = 2; d < 59; d++) {
    if (offset(addDays(today, d)) !== offset(today)) {
      day = addDays(today, d + 1);
      break;
    }
  }
  test.info().annotations.push({ type: "day", description: `${day} (${offset(day)}; today ${offset(today)})` });

  const email = unique("dst");
  await page.goto("/en/booking?service=vo2max");
  const time = await pickTime(page, "en", day, 3);
  await fillDetails(page, "en", { name: "Bor Kranjc", email, phone: "040 123 456" });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You're booked");
  const shown = await page.getByTestId("booking-when").innerText();
  expect(shown).toBe(`${formatDate(`${day}T12:00:00Z`, "en")}, ${time}`);

  const mail = await confirmationEmail(bookingId(page));
  expect(mail.html).toContain(shown);
  expect(icsStart(mail.ics)).toBe(`${day} ${time}`);
});

// Up to the review step in a fresh browser, on the first free time.
async function toReview(browser: Browser, baseURL: string, name: string, email: string) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await context.addCookies([consentCookie(baseURL)]);
  const page = await context.newPage();
  await page.goto("/en/booking?service=personal-training");
  const time = await pickTime(page, "en");
  await expect(stepHeading(page)).toHaveText("Your details");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone", { exact: true }).fill("041 555 666");
  await page.getByRole("checkbox", { name: /I accept the/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(stepHeading(page)).toHaveText("Check and confirm");
  return { page, time };
}

test("two browsers pick the same time: the second gets 'slot taken' and keeps the details", async ({ browser, baseURL }) => {
  const first = await toReview(browser, baseURL!, "Cene Prvi", unique("first"));
  const secondEmail = unique("second");
  const second = await toReview(browser, baseURL!, "Dana Druga", secondEmail);
  expect(second.time).toBe(first.time);

  await first.page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(first.page.getByRole("heading", { level: 1 })).toHaveText("You're booked");

  await second.page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(second.page.getByRole("alert").filter({ hasText: "Someone has just booked that time" })).toBeVisible();
  await expect(stepHeading(second.page)).toHaveText("Pick a date and time");
  await noAxeViolations(second.page);
  await shot(second.page, "375-en-slot-taken.png");

  await pickTime(second.page, "en", undefined, 1);
  await expect(second.page.getByLabel("Full name")).toHaveValue("Dana Druga");
  await expect(second.page.getByLabel("Email", { exact: true })).toHaveValue(secondEmail);
  await expect(second.page.getByLabel("Phone", { exact: true })).toHaveValue("041 555 666");
  await second.page.getByRole("button", { name: "Continue" }).click();
  await second.page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(second.page.getByRole("heading", { level: 1 })).toHaveText("You're booked");
  await Promise.all([first.page.context().close(), second.page.context().close()]);
});

test("the api is down at confirm: phone and email instead", async ({ page }) => {
  await page.route("**/api/booking", (route) => (route.request().method() === "POST" ? route.abort() : route.continue()));
  await page.goto("/en/booking?service=personal-training");
  await pickTime(page, "en");
  await page.getByLabel("Full name").fill("Eva Down");
  await page.getByLabel("Email", { exact: true }).fill(unique("down"));
  await page.getByLabel("Phone", { exact: true }).fill("041 555 666");
  await page.getByRole("checkbox", { name: /I accept the/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  const alert = page.getByRole("alert").filter({ hasText: "Booking isn't working right now" });
  await expect(alert).toContainText("Booking isn't working right now");
  await expect(alert.getByRole("link", { name: "+386 64 146 508" })).toHaveAttribute("href", "tel:+38664146508");
  await expect(alert.getByRole("link", { name: "jaka.marinko06@gmail.com" })).toBeVisible();
  await shot(page, "375-en-unavailable.png");
});

test("the link from the email cancels, and says why when it's too late", async ({ page, browser, baseURL }) => {
  const email = unique("cancel");
  await page.goto("/en/booking?service=personal-training");
  await pickTime(page, "en");
  await page.getByLabel("Full name").fill("Fran Odpoved");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone", { exact: true }).fill("041 555 666");
  await page.getByRole("checkbox", { name: /I accept the/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You're booked");
  const link = /href="([^"]*\/booking\/[^"]+)"/.exec((await confirmationEmail(bookingId(page))).html)![1]!.replaceAll("&amp;", "&");
  const manage = new URL(link);

  // A fresh browser with only the link: no session, the token is enough.
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await context.addCookies([consentCookie(baseURL!)]);
  const guest = await context.newPage();
  await guest.goto(manage.pathname + manage.search);
  await expect(guest.getByRole("heading", { level: 1 })).toHaveText("Your booking");
  await noAxeViolations(guest);
  await shot(guest, "375-en-manage.png");
  await guest.getByRole("button", { name: "Cancel booking" }).click();
  await guest.getByRole("button", { name: "Yes, cancel it" }).click();
  await expect(guest.getByTestId("booking-status")).toHaveText("Cancelled");
  await expect(guest.getByRole("link", { name: "Book another time" })).toBeVisible();

  // Without the token it's not found.
  await guest.goto(manage.pathname);
  await expect(guest.getByText("We can't find this booking")).toBeVisible();

  // Less than 24 h before: the page explains instead of offering to cancel.
  const id = manage.pathname.split("/").pop()!;
  await sql("update bookings set status = 'confirmed', start_at = now() + interval '2 hours', end_at = now() + interval '3 hours' where id = $1", [id]);
  await guest.goto(manage.pathname + manage.search);
  await expect(guest.getByText("Free cancellation ends 24 hours before the start")).toBeVisible();
  await expect(guest.getByRole("button", { name: "Cancel booking" })).toHaveCount(0);
  await shot(guest, "375-en-manage-too-late.png");
  await context.close();
});
