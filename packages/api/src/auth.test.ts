import { expect, test } from "vitest";
import { roleAllows } from "./auth";

test("owner ⊇ head_coach ⊇ coach", () => {
  expect(roleAllows("owner", ["coach"])).toBe(true);
  expect(roleAllows("head_coach", ["coach"])).toBe(true);
  expect(roleAllows("coach", ["head_coach"])).toBe(false);
  expect(roleAllows("head_coach", ["owner"])).toBe(false);
});

test("customers and athletes match only their own role", () => {
  expect(roleAllows("customer", ["coach"])).toBe(false);
  expect(roleAllows("athlete", ["customer"])).toBe(false);
  expect(roleAllows("athlete", ["athlete"])).toBe(true);
  expect(roleAllows("owner", ["athlete"])).toBe(false);
});
