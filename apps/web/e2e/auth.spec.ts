import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { serializeConsent } from "../src/lib/consent";

// A cookie choice is already made, so the cookie banner doesn't cover the sign-in and consent pages.
test.beforeEach(async ({ context, baseURL }) => {
  const value = encodeURIComponent(serializeConsent({ analytics: false, marketing: false }));
  await context.addCookies([{ name: "jm_consent", value, url: baseURL! }]);
});

// The api runs from apps/api, so its dev email transport writes to apps/api/.emails.
const outbox = path.join(__dirname, "../../api/.emails");

// The newest sign-in link sent to this address.
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

async function signIn(page: Page, locale: "en" | "sl", email: string) {
  await page.goto(`/${locale}/sign-in`);
  await page.locator("#email").fill(email);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  await page.goto(await magicLink(email));
}

const unique = (name: string) => `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;

test("magic link sign-in, consent step, then sign out", async ({ page }) => {
  const email = unique("ana");

  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Faccount$/);

  await signIn(page, "en", email);
  await expect(page).toHaveURL(/\/en\/consent/);

  // Without health data consent the account and coach areas send you back to the consent step.
  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/consent\?next=%2Faccount$/);
  await page.goto("/en/coach");
  await expect(page).toHaveURL(/\/en\/consent\?next=%2Fcoach$/);

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Please agree to the processing of your health data to continue.")).toBeVisible();
  await page.getByRole("checkbox", { name: /health and training data/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/en\/coach$/);
  // A customer isn't staff: the coach area is a 404 for them.
  expect((await page.goto("/en/coach"))?.status()).toBe(404);

  await page.goto("/en/account");
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  const me = await (await page.request.get("/api/auth/me")).json();
  expect(me).toMatchObject({ user: { email, role: "customer", locale: "en" }, consents: { health_data: true, marketing: false } });

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/en\/sign-in$/);
  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Faccount$/);
});

test("signing in from /sl makes a Slovenian account and a Slovenian email", async ({ page }) => {
  const email = unique("bor");
  await signIn(page, "sl", email);
  await expect(page).toHaveURL(/\/sl\/consent$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Preden začneš");

  const me = await (await page.request.get("/api/auth/me")).json();
  expect(me.user.locale).toBe("sl");
});

test("a used link sends you back to sign in with an error", async ({ page, browser }) => {
  const email = unique("cene");
  await signIn(page, "en", email);
  const link = await magicLink(email);

  const other = await browser.newPage();
  await other.goto(link);
  await expect(other).toHaveURL(/\/en\/sign-in\?error=/);
  await expect(other.getByText("That sign-in link has expired or was already used. Ask for a new one.")).toBeVisible();
  await other.close();
});

test("after sign-in, next keeps a path with its query on this site, and never leads to another one", async ({ page, baseURL }) => {
  const email = unique("next");
  await page.goto(`/en/sign-in?next=${encodeURIComponent("//evil.example/x")}`);
  await page.locator("#email").fill(email);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("status")).toContainText(email);
  await page.goto(await magicLink(email));
  await expect(page).toHaveURL(`${baseURL}/en/consent`);
  expect((await page.request.post("/api/auth/consents", { data: { kind: "health_data", granted: true } })).ok()).toBe(true);

  for (const bad of ["//evil.example", "https://evil.example", "/\\evil.example", "/\t/evil.example", "/\n/evil.example"]) {
    await page.goto(`/en/sign-in/continue?next=${encodeURIComponent(bad)}`);
    await expect(page).toHaveURL(`${baseURL}/en/account`);
  }
  await page.goto(`/en/sign-in/continue?next=${encodeURIComponent("/account/privacy/delete?token=abc_123")}`);
  await expect(page).toHaveURL(`${baseURL}/en/account/privacy/delete?token=abc_123`);
});
