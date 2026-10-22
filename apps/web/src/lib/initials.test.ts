import { expect, test } from "vitest";
import { initials } from "./initials";

test.each([
  ["Ana Novak", "ana@example.com", "AN"],
  ["Ana-Marija Novak Kranjc Vidmar Potočnik", "a@example.com", "AN"],
  ["  žan  ", "zan@example.com", "Ž"],
  ["", "ana.novak@example.com", "A"],
  ["   ", "šime@example.com", "Š"],
])("%j / %s → %s", (name, email, expected) => {
  expect(initials(name, email)).toBe(expected);
});
