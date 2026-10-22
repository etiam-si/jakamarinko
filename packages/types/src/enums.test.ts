import { expect, test } from "vitest";
import { defaultLocale, locales } from "./enums";

test("the default locale is one of the locales", () => {
  expect(locales).toContain(defaultLocale);
});
