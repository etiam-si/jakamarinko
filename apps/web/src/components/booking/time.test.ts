import { expect, test } from "vitest";
import { addDays, formatDate, formatTime, formatWhen, localDay, slotsByDay } from "./time";

// 2026-10-25 03:00 CEST becomes 02:00 CET: the same wall time is a different UTC hour on each side.
test("16:00 in Ljubljana stays 16:00 across the October DST change", () => {
  expect(formatTime("2026-10-24T14:00:00Z", "en")).toBe("16:00");
  expect(formatTime("2026-10-26T15:00:00Z", "en")).toBe("16:00");
  expect(formatWhen("2026-10-26T15:00:00Z", "en")).toBe("Monday 26 October, 16:00");
  expect(formatWhen("2026-10-26T15:00:00Z", "sl")).toBe("ponedeljek, 26. oktober, 16:00");
});

test("and across the March one", () => {
  expect(formatTime("2027-03-27T08:00:00Z", "sl")).toBe("09:00");
  expect(formatTime("2027-03-29T07:00:00Z", "sl")).toBe("09:00");
});

test("the Ljubljana date, not the UTC one", () => {
  expect(localDay(new Date("2026-10-26T23:30:00Z"))).toBe("2026-10-27");
  expect(formatDate("2026-10-26T23:30:00Z", "en")).toBe("Tuesday 27 October");
});

test("addDays crosses months and the DST change", () => {
  expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
  expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
});

test("slots grouped by day, sorted, one per start time", () => {
  const days = slotsByDay([
    { start: "2026-10-27T15:00:00Z", coachId: "b" },
    { start: "2026-10-26T16:00:00Z", coachId: "a" },
    { start: "2026-10-26T15:00:00Z", coachId: "a" },
    { start: "2026-10-26T15:00:00Z", coachId: "b" },
  ]);
  expect([...days.keys()]).toEqual(["2026-10-26", "2026-10-27"]);
  expect(days.get("2026-10-26")).toEqual([
    { start: "2026-10-26T15:00:00Z", coachId: "a" },
    { start: "2026-10-26T16:00:00Z", coachId: "a" },
  ]);
});
