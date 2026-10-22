import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { serializeConsent } from "../src/lib/consent";

// Needs Stripe test mode: PAYMENTS_ENABLED=true, a sk_test_ STRIPE_SECRET_KEY and the STRIPE_WEBHOOK_SECRET printed by
// `stripe listen --forward-to localhost:$API_PORT/api/payments/stripe`, which must keep running during the test.
// Run it on its own (`pnpm --filter @jakamarinko/web e2e payments`): with payments on, the pay-on-site specs don't apply.
const live = process.env.PAYMENTS_ENABLED === "true" && /^sk_test_/.test(process.env.STRIPE_SECRET_KEY ?? "");
test.skip(!live, "needs Stripe test keys (PAYMENTS_ENABLED=true, STRIPE_SECRET_KEY=sk_test_…, STRIPE_WEBHOOK_SECRET)");
test.setTimeout(120_000);

const outbox = path.join(__dirname, "../../api/.emails");

test("book, pay with the test card 4242, land on the confirmed page and get the confirmation email", async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: "jm_consent", value: encodeURIComponent(serializeConsent({ analytics: false, marketing: false })), url: baseURL! },
  ]);
  const email = `paid-${Date.now()}@example.com`;
  await page.goto("/en/booking?service=personal-training");
  await page.locator('input[name="time"]').first().check({ force: true });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").fill("Pia Plačnik");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone", { exact: true }).fill("041 555 666");
  await page.getByRole("checkbox", { name: /I accept the/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("payment-note")).toContainText("Stripe");
  await page.getByRole("button", { name: "Continue to payment" }).click();

  await page.waitForURL(/checkout\.stripe\.com/);
  await page.locator("#cardNumber").fill("4242 4242 4242 4242");
  await page.locator("#cardExpiry").fill("12 / 34");
  await page.locator("#cardCvc").fill("123");
  await page.locator("#billingName").fill("Pia Placnik");
  await page.getByTestId("hosted-payment-submit-button").click();

  await page.waitForURL(/\/en\/booking\/[0-9a-f-]+\?token=.+&confirmed=1&paid=1$/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You're booked", { timeout: 30_000 });
  await expect(page.getByTestId("booking-status")).toHaveText("Confirmed");

  const id = new URL(page.url()).pathname.split("/").pop()!;
  await expect
    .poll(async () => {
      for (const file of (await readdir(outbox).catch(() => [])).filter((f) => f.endsWith(".html"))) {
        const html = await readFile(path.join(outbox, file), "utf8");
        if (html.includes(`/booking/${id}?`) && html.includes("Your booking is confirmed")) return true;
      }
      return false;
    })
    .toBe(true);
});
