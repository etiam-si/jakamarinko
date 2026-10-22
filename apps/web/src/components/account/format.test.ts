import { expect, test } from "vitest";
import type { AccountBooking } from "@jakamarinko/api";
import { formatDay, formatTime, splitBookings, startsIn } from "./format";

const now = new Date("2026-11-01T12:00:00Z");

test("dates and times are Ljubljana time", () => {
  expect(formatTime("2026-11-02T15:00:00.000Z", "en")).toBe("16:00");
  expect(formatDay("2026-11-02T15:00:00.000Z", "sl")).toMatch(/ponedeljek/);
});

test("the countdown picks minutes, hours up to two days, then days", () => {
  expect(startsIn("2026-11-01T12:40:00Z", now, "en")).toBe("in 40 minutes");
  expect(startsIn("2026-11-02T15:00:00Z", now, "en")).toBe("in 27 hours");
  expect(startsIn("2026-11-05T12:00:00Z", now, "en")).toBe("in 4 days");
  expect(startsIn("2026-11-05T12:00:00Z", now, "sl")).toBe("čez 4 dni");
});

test("upcoming: active and not started; the rest newest first", () => {
  const b = (id: string, start: string, status: AccountBooking["status"] = "confirmed") => ({ id, start, status }) as AccountBooking;
  const all = [
    b("old", "2026-10-01T10:00:00Z", "completed"),
    b("gone", "2026-11-03T10:00:00Z", "cancelled"),
    b("next", "2026-11-04T10:00:00Z"),
    b("later", "2026-11-09T10:00:00Z", "pending_payment"),
  ];
  const { upcoming, past } = splitBookings(all, now);
  expect(upcoming.map((x) => x.id)).toEqual(["next", "later"]);
  expect(past.map((x) => x.id)).toEqual(["gone", "old"]);
});
