import { expect, test } from "vitest";
import { webmail } from "./webmail";

test.each([
  ["ana@gmail.com", "Gmail"],
  ["Ana@GoogleMail.com", "Gmail"],
  ["ana@hotmail.com", "Outlook"],
  ["ana@outlook.com", "Outlook"],
  ["ana@siol.net", null],
  ["ana@gmail.com.evil.example", null],
])("%s → %s", (email, name) => {
  expect(webmail(email)?.name ?? null).toBe(name);
});
