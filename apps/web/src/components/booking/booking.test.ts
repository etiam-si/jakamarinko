import { expect, test } from "vitest";
import { googleCalendarUrl, icsFile } from "./calendar-file";
import { anyYes, healthAnswers, healthComplete } from "./health";

const event = {
  id: "b1",
  start: "2026-10-26T15:00:00.000Z",
  end: "2026-10-26T16:30:00.000Z",
  title: "Performance package, Jaka Marinko",
  location: "Lab, Cesta 1; Ljubljana",
  url: "https://jakamarinko.com/en/booking/b1?token=t",
};

test("the .ics has the booking's instants in UTC", () => {
  const ics = icsFile(event, new Date("2026-10-22T10:00:00Z"));
  expect(ics).toContain("DTSTART:20261026T150000Z\r\n");
  expect(ics).toContain("DTEND:20261026T163000Z\r\n");
  expect(ics).toContain("LOCATION:Lab\\, Cesta 1\\; Ljubljana\r\n");
});

test("the Google Calendar link", () => {
  const url = new URL(googleCalendarUrl(event));
  expect(url.searchParams.get("dates")).toBe("20261026T150000Z/20261026T163000Z");
});

test("health answers: complete, any yes, and what the api gets", () => {
  const all = { heart_condition: false, chest_pain: false, dizziness: false, chronic_condition: false, medication: false, bone_joint: false };
  expect(healthComplete(all)).toBe(false);
  expect(healthComplete({ ...all, supervised_only: false })).toBe(true);
  expect(anyYes({ ...all, supervised_only: false })).toBe(false);
  expect(anyYes({ ...all, bone_joint: true })).toBe(true);
  expect(healthAnswers({ ...all, supervised_only: true, other: "  asthma " })).toEqual({ ...all, supervised_only: true, other: "asthma" });
  expect(healthAnswers({ ...all, supervised_only: false, other: " " })).not.toHaveProperty("other");
});
