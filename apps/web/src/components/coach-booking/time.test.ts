import { expect, test } from "vitest";
import { addDays, dateOf, localDate, pickerDay, weekday, weekStart } from "./time";

test("the Ljubljana date flips at local midnight, not UTC midnight", () => {
  expect(localDate(new Date("2026-11-01T22:59:00Z"))).toBe("2026-11-01");
  expect(localDate(new Date("2026-11-01T23:00:00Z"))).toBe("2026-11-02");
  // Summer: UTC+2.
  expect(localDate(new Date("2026-07-01T22:00:00Z"))).toBe("2026-07-02");
});

test("weeks start on Monday, across a month and a DST change", () => {
  expect(weekday("2026-10-25")).toBe(7);
  expect(weekStart("2026-10-25")).toBe("2026-10-19");
  expect(weekStart("2026-11-02")).toBe("2026-11-02");
  expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
});

test("a picked calendar day keeps its date", () => {
  expect(dateOf(new Date(2026, 10, 2))).toBe("2026-11-02");
  expect(dateOf(pickerDay("2026-03-29"))).toBe("2026-03-29");
});
