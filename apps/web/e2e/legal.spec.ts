import { expect, test } from "@playwright/test";

// The e2e server runs without LEGAL_APPROVED, so every legal page must show the draft banner.
for (const [locale, banner] of [["en", "Draft, not yet in force."], ["sl", "Osnutek, še ne velja."]] as const) {
  for (const doc of ["privacy", "terms", "cookies"]) {
    test(`/${locale}/legal/${doc} shows the draft banner`, async ({ page }) => {
      await page.goto(`/${locale}/legal/${doc}`);
      await expect(page.getByRole("status")).toContainText(banner);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("main")).not.toContainText(/\{\w+\}|legal\.\w+/);
    });
  }
}
