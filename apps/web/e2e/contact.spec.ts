import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { Client } from "pg";
import type { Role } from "@jakamarinko/types";
import { serializeConsent } from "../src/lib/consent";

// A cookie choice is already made, so the cookie banner doesn't cover the form. Each test sends from its own IP
// (the api trusts CF-Connecting-IP), so reruns against a running api don't hit the 5-per-hour limit.
test.beforeEach(async ({ context, baseURL }) => {
  const value = encodeURIComponent(serializeConsent({ analytics: false, marketing: false }));
  await context.addCookies([{ name: "jm_consent", value, url: baseURL! }]);
  await context.setExtraHTTPHeaders({ "cf-connecting-ip": randomIp() });
});

const randomIp = () => `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 255)).join(".")}`;
const outbox = path.join(__dirname, "../../api/.emails");
const unique = (name: string) => `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;

// Every email body in .emails that contains `text`.
async function emailsWith(text: string) {
  const files = await readdir(outbox).catch(() => []);
  const bodies = await Promise.all(files.filter((f) => f.endsWith(".html")).map((f) => readFile(path.join(outbox, f), "utf8")));
  return bodies.filter((html) => html.includes(text));
}

async function magicLink(email: string) {
  let link: string | undefined;
  await expect
    .poll(async () => {
      const [html] = await emailsWith(email);
      return (link = html && /href="([^"]+)"/.exec(html)?.[1]?.replaceAll("&amp;", "&"));
    })
    .toBeTruthy();
  return link!;
}

// This worktree's database: no admin screen gives roles yet, and the honeypot test looks for stored rows.
async function sql(text: string, values: unknown[]) {
  const client = new Client({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54320/postgres" });
  await client.connect();
  try {
    return (await client.query(text, values)).rows;
  } finally {
    await client.end();
  }
}
const setRole = (email: string, role: Role) => sql("update users set role = $1 where email = $2", [role, email]);

async function signInAs(page: Page, role: Role) {
  const email = unique(role);
  await page.goto("/sl/sign-in");
  await page.locator("#email").fill(email);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  await page.goto(await magicLink(email));
  await expect(page).toHaveURL(/\/sl\/consent/);
  expect((await page.request.post("/api/auth/consents", { data: { kind: "health_data", granted: true } })).ok()).toBe(true);
  await setRole(email, role);
}

test("a message in SL: stored in the inbox, the coach is emailed, the sender gets an SL auto-reply", async ({ page }) => {
  const email = unique("ana");
  const name = `Ana ${Date.now()}`;

  // The coaching page's package buttons land here with the package named.
  await page.goto("/sl/contact?package=coaching");
  const form = page.getByRole("form", { name: "Pošlji sporočilo" });
  await expect(form.getByLabel("Tema")).toHaveText("Trenerstvo");
  await expect(form.getByLabel("Sporočilo")).toHaveValue(/^Zanima me: Coaching\./);

  // Nothing is sent before the required fields and the consent are there.
  await form.getByRole("button", { name: "Pošlji sporočilo" }).click();
  await expect(form.getByText("Vpiši svoje ime.")).toBeVisible();
  await expect(form.getByText("Strinjaj se, da te kontaktiramo")).toBeVisible();

  await form.getByLabel("Ime").fill(name);
  await form.getByLabel("E-pošta", { exact: true }).fill(email);
  await form.getByLabel("Sporočilo").fill("Zanima me Coaching paket za gorski tek.");
  await form.getByRole("checkbox", { name: /Glede tega sporočila/ }).click();
  await form.getByRole("button", { name: "Pošlji sporočilo" }).click();
  await expect(page.getByRole("status")).toContainText("Hvala, sporočilo je poslano");

  // .emails/: one email to the coach naming the sender, one SL auto-reply to the sender.
  await expect.poll(async () => (await emailsWith(`mailto:${email}`)).length).toBe(1);
  const [coach] = await emailsWith(`mailto:${email}`);
  expect(coach).toContain("gorski tek");
  expect(coach).toMatch(/\/coach\/requests\/[0-9a-f-]{36}/);
  await expect.poll(async () => (await emailsWith(`Živjo, ${name}!`)).length).toBe(1);
  const [reply] = await emailsWith(`Živjo, ${name}!`);
  expect(reply).toContain('lang="sl"');
  expect(reply).toContain("Hvala za sporočilo");
  expect(reply).not.toContain("gorski tek");

  // The coach finds it in the inbox, opens it, replies by email and marks it answered.
  await signInAs(page, "coach");
  await page.goto("/sl/coach/requests?status=new");
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("Zanima me Coaching paket za gorski tek.")).toBeVisible();
  const replyLink = page.getByRole("link", { name: "Odgovori po e-pošti" });
  await expect(replyLink).toHaveAttribute("href", `mailto:${email}?subject=${encodeURIComponent("Re: tvoje sporočilo Jaki Marinku")}`);

  await page.getByLabel("Status").click();
  await page.getByRole("option", { name: "Odgovorjeno" }).click();
  await expect(page.getByText("Status spremenjen v: Odgovorjeno")).toBeVisible();

  await page.goto("/sl/coach/requests?status=new");
  await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
  await page.getByRole("link", { name: "Odgovorjeno" }).click();
  await expect(page).toHaveURL(/status=answered/);
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
});

test("the 6th message from one IP within an hour gets a friendly message", async ({ page }) => {
  const send = () =>
    page.request.post("/api/requests", {
      data: { name: "Bo", email: unique("bo"), topic: "other", message: "Hi", locale: "en", consent: true },
    });
  for (let i = 0; i < 5; i++) expect((await send()).status()).toBe(200);
  expect((await send()).status()).toBe(429);

  await page.goto("/en/contact");
  const form = page.getByRole("form", { name: "Send a message" });
  await form.getByLabel("Name", { exact: true }).fill("Bo");
  await form.getByLabel("Email", { exact: true }).fill(unique("bo"));
  await form.getByLabel("Topic").click();
  await page.getByRole("option", { name: "Something else" }).click();
  await form.getByLabel("Message", { exact: true }).fill("Hi");
  await form.getByRole("checkbox", { name: /You may contact me/ }).click();
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form.getByRole("alert")).toHaveText(/You've sent several messages in the last hour/);
});

test("a filled honeypot looks sent, but nothing is stored or emailed", async ({ page }) => {
  const email = unique("bot");
  const res = await page.request.post("/api/requests", {
    data: { name: "Bot", email, topic: "other", message: "Buy now", locale: "en", consent: true, website: "https://spam.example" },
  });
  expect(res.status()).toBe(200);
  // Give a stray email time to show up before checking there is none.
  await page.waitForTimeout(500);
  expect(await emailsWith(email)).toEqual([]);
  expect(await sql("select id from requests where email = $1", [email])).toEqual([]);
});

test("a customer gets a 403 from the inbox api", async ({ page }) => {
  await signInAs(page, "customer");
  expect((await page.request.get("/api/requests")).status()).toBe(403);
});
