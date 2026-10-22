import { expect, test } from "vitest";
import { icsEvent } from "./ics";

const event = {
  uid: "bk_1",
  start: new Date("2026-07-01T06:30:00Z"),
  end: new Date("2026-07-01T08:00:00Z"),
  summary: "Laktatni profil, Jaka Marinko",
  location: "Lab; Celovška cesta 1, Ljubljana",
};

test("times are Ljubljana local time with the zone attached", () => {
  const ics = icsEvent(event, new Date("2026-06-01T00:00:00Z"));
  // Summer: UTC+2.
  expect(ics).toContain("DTSTART;TZID=Europe/Ljubljana:20260701T083000\r\n");
  expect(ics).toContain("DTEND;TZID=Europe/Ljubljana:20260701T100000\r\n");
  expect(ics).toContain("BEGIN:VTIMEZONE\r\nTZID:Europe/Ljubljana\r\n");
  expect(ics).toContain("DTSTAMP:20260601T000000Z\r\n");
});

test("winter times use UTC+1", () => {
  const ics = icsEvent({ ...event, start: new Date("2026-12-01T08:00:00Z"), end: new Date("2026-12-01T09:00:00Z") });
  expect(ics).toContain("DTSTART;TZID=Europe/Ljubljana:20261201T090000\r\n");
});

test("text is escaped and long lines fold without splitting characters", () => {
  const ics = icsEvent({ ...event, location: "č".repeat(60) });
  expect(ics).toContain("SUMMARY:Laktatni profil\\, Jaka Marinko");
  for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  const unfolded = ics.replace(/\r\n /g, "");
  expect(unfolded).toContain(`LOCATION:${"č".repeat(60)}\r\n`);
});

test("a sequence is written only when given, so the first invite stays at 0", () => {
  expect(icsEvent(event)).not.toContain("SEQUENCE");
  expect(icsEvent({ ...event, sequence: 3 })).toContain("SEQUENCE:3\r\n");
});
