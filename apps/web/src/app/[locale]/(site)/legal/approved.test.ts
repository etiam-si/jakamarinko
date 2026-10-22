import { expect, test } from "vitest";
import { legalApproved } from "./approved";

test("draft unless LEGAL_APPROVED is exactly true", () => {
  expect(legalApproved(undefined)).toBe(false);
  expect(legalApproved("")).toBe(false);
  expect(legalApproved("false")).toBe(false);
  expect(legalApproved("true")).toBe(true);
});

test("a typo fails loudly instead of hiding the banner", () => {
  expect(() => legalApproved("yes")).toThrow();
});
