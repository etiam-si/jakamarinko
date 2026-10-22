import { expect, test } from "@playwright/test";
import enHome from "../messages/en/home.json";
import slHome from "../messages/sl/home.json";

test.describe("Slovenian browser", () => {
  test.use({ locale: "sl-SI" });

  test("/ redirects to /sl", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/sl$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "sl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(slHome.hero.title);
  });
});

test.describe("any other browser", () => {
  test.use({ locale: "de-DE" });

  test("/ redirects to /en, and switching language keeps the choice", async ({ page, context }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(enHome.hero.title);

    await page.getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitem", { name: "Slovenščina" }).click();
    await expect(page).toHaveURL(/\/sl$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(slHome.hero.title);

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "NEXT_LOCALE")?.value).toBe("sl");
    await page.goto("/");
    await expect(page).toHaveURL(/\/sl$/);
  });
});

test("the web server proxies /api to this worktree's api", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true, service: "api" });
});
