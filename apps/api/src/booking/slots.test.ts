import { describe, expect, test } from "vitest";
import { freeSlots, type SlotInput } from "./slots";
import { localDate, zoned } from "./time";

const lab = "lab";
// Mon–Fri 16:00–20:00, Sat 09:00–13:00, like the sample seed.
const week = [1, 2, 3, 4, 5]
  .map((weekday) => ({ weekday, start: "16:00", end: "20:00", locationId: lab }))
  .concat({ weekday: 6, start: "09:00", end: "13:00", locationId: lab });

const base: SlotInput = {
  from: "2026-11-02",
  to: "2026-11-02",
  now: new Date("2026-10-01T00:00:00Z"),
  rules: week,
  exceptions: [],
  busy: [],
  durationMin: 60,
  bufferMin: 15,
  noticeMin: 24 * 60,
  horizonDays: 60,
  stepMin: 30,
};

const iso = (slots: { start: Date }[]) => slots.map((s) => s.start.toISOString());
const at = (date: string, time: string) => zoned(date, Number(time.slice(0, 2)) * 60 + Number(time.slice(3)));

describe("weekly template", () => {
  test("a Monday in winter (UTC+1): 16:00–19:00 starts every 30 min, the last one ends at 20:00", () => {
    const slots = freeSlots(base);
    expect(iso(slots)).toEqual([
      "2026-11-02T15:00:00.000Z",
      "2026-11-02T15:30:00.000Z",
      "2026-11-02T16:00:00.000Z",
      "2026-11-02T16:30:00.000Z",
      "2026-11-02T17:00:00.000Z",
      "2026-11-02T17:30:00.000Z",
      "2026-11-02T18:00:00.000Z",
    ]);
    expect(slots.at(-1)!.end.toISOString()).toBe("2026-11-02T19:00:00.000Z");
    expect(slots.every((s) => s.locationId === lab)).toBe(true);
  });

  test("a Sunday has no slots", () => {
    expect(freeSlots({ ...base, from: "2026-11-08", to: "2026-11-08" })).toEqual([]);
  });

  test("a long service fits fewer slots: 120 min on Saturday 09:00–13:00", () => {
    const slots = freeSlots({ ...base, from: "2026-11-07", to: "2026-11-07", durationMin: 120 });
    expect(slots.map((s) => localTime(s.start))).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });
});

describe("DST", () => {
  test("across the autumn change (25 October 2026): 16:00 is 14:00 UTC on the Friday before, 15:00 UTC on the Monday after", () => {
    const slots = freeSlots({ ...base, now: new Date("2026-10-01T00:00:00Z"), from: "2026-10-23", to: "2026-10-26" });
    const firstOf = (date: string) => slots.find((s) => localDate(s.start) === date)!.start.toISOString();
    expect(firstOf("2026-10-23")).toBe("2026-10-23T14:00:00.000Z"); // Friday, CEST
    expect(firstOf("2026-10-24")).toBe("2026-10-24T07:00:00.000Z"); // Saturday 09:00, CEST
    expect(firstOf("2026-10-26")).toBe("2026-10-26T15:00:00.000Z"); // Monday, CET
  });

  test("spring forward (29 March 2026): a night window 00:00–04:00 is only 3 real hours long", () => {
    const slots = freeSlots({
      ...base,
      now: new Date("2026-03-01T00:00:00Z"),
      from: "2026-03-29",
      to: "2026-03-29",
      stepMin: 60,
      exceptions: [{ kind: "open", startDate: "2026-03-29", endDate: "2026-03-29", start: "00:00", end: "04:00", locationId: lab }],
    });
    // 00:00 CET, 01:00 CET, then 03:00 CEST (02:00 doesn't exist); 04:00 CEST is the end.
    expect(iso(slots)).toEqual(["2026-03-28T23:00:00.000Z", "2026-03-29T00:00:00.000Z", "2026-03-29T01:00:00.000Z"]);
    expect(slots.map((s) => localTime(s.start))).toEqual(["00:00", "01:00", "03:00"]);
  });

  test("fall back (25 October 2026): the same window is 5 real hours long", () => {
    const slots = freeSlots({
      ...base,
      from: "2026-10-25",
      to: "2026-10-25",
      stepMin: 60,
      exceptions: [{ kind: "open", startDate: "2026-10-25", endDate: "2026-10-25", start: "00:00", end: "04:00", locationId: lab }],
    });
    expect(slots).toHaveLength(5);
    expect(slots[0]!.start.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(slots.at(-1)!.end.toISOString()).toBe("2026-10-25T03:00:00.000Z");
  });

  test("a Saturday rule on the spring-forward weekend keeps its wall-clock time", () => {
    const slots = freeSlots({ ...base, now: new Date("2026-03-01T00:00:00Z"), from: "2026-03-28", to: "2026-03-30" });
    expect(slots.find((s) => localDate(s.start) === "2026-03-28")!.start.toISOString()).toBe("2026-03-28T08:00:00.000Z");
    expect(slots.find((s) => localDate(s.start) === "2026-03-30")!.start.toISOString()).toBe("2026-03-30T14:00:00.000Z");
  });
});

describe("exceptions", () => {
  test("a closed exception closes the whole day, and only that day", () => {
    const slots = freeSlots({
      ...base,
      from: "2026-11-02",
      to: "2026-11-03",
      exceptions: [{ kind: "closed", startDate: "2026-11-02", endDate: "2026-11-02", start: null, end: null }],
    });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => localDate(s.start) === "2026-11-03")).toBe(true);
  });

  test("a closed range spans several days", () => {
    const exceptions = [{ kind: "closed" as const, startDate: "2026-11-02", endDate: "2026-11-07", start: null, end: null }];
    expect(freeSlots({ ...base, from: "2026-11-01", to: "2026-11-08", exceptions })).toEqual([]);
  });

  test("closed hours remove only the slots that touch them", () => {
    const slots = freeSlots({
      ...base,
      exceptions: [{ kind: "closed", startDate: "2026-11-02", endDate: "2026-11-02", start: "17:00", end: "18:00" }],
    });
    expect(slots.map((s) => localTime(s.start))).toEqual(["16:00", "18:00", "18:30", "19:00"]);
  });

  test("open hours add a day outside the template, at their own location", () => {
    const slots = freeSlots({
      ...base,
      from: "2026-11-08",
      to: "2026-11-08",
      exceptions: [{ kind: "open", startDate: "2026-11-08", endDate: "2026-11-08", start: "10:00", end: "12:00", locationId: "track" }],
    });
    expect(slots.map((s) => [localTime(s.start), s.locationId])).toEqual([
      ["10:00", "track"],
      ["10:30", "track"],
      ["11:00", "track"],
    ]);
  });

  test("open hours overlapping the template don't duplicate slots", () => {
    const slots = freeSlots({
      ...base,
      exceptions: [{ kind: "open", startDate: "2026-11-02", endDate: "2026-11-02", start: "19:00", end: "21:00", locationId: lab }],
    });
    expect(slots.map((s) => localTime(s.start))).toEqual(["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"]);
  });
});

describe("bookings and buffer", () => {
  test("a booking blocks every overlapping slot plus 15 min on both sides", () => {
    const busy = [{ start: at("2026-11-02", "17:00"), end: at("2026-11-02", "18:00") }];
    const slots = freeSlots({ ...base, busy });
    // 16:00 would end at 17:00, inside the buffer before; 18:00 starts inside the buffer after.
    expect(slots.map((s) => localTime(s.start))).toEqual(["18:30", "19:00"]);
  });

  test("without a buffer, back-to-back slots are free", () => {
    const busy = [{ start: at("2026-11-02", "17:00"), end: at("2026-11-02", "18:00") }];
    const slots = freeSlots({ ...base, busy, bufferMin: 0 });
    expect(slots.map((s) => localTime(s.start))).toEqual(["16:00", "18:00", "18:30", "19:00"]);
  });

  test("a booking ending exactly at the buffer edge leaves the slot free", () => {
    const busy = [{ start: at("2026-11-02", "15:00"), end: at("2026-11-02", "15:45") }];
    expect(freeSlots({ ...base, busy })[0]!.start).toEqual(at("2026-11-02", "16:00"));
  });
});

describe("notice and horizon", () => {
  test("nothing starts within 24 h of now", () => {
    const now = at("2026-11-01", "17:10"); // Sunday 17:10; Monday 17:10 is 24 h later
    const slots = freeSlots({ ...base, now });
    expect(slots.map((s) => localTime(s.start))).toEqual(["17:30", "18:00", "18:30", "19:00"]);
  });

  test("a slot exactly 24 h ahead is allowed", () => {
    const now = at("2026-11-01", "17:00");
    expect(localTime(freeSlots({ ...base, now })[0]!.start)).toBe("17:00");
  });

  test("nothing starts more than 60 days after now", () => {
    const now = at("2026-11-02", "17:00");
    const slots = freeSlots({ ...base, now, from: "2026-12-30", to: "2027-01-06" });
    const last = slots.at(-1)!.start;
    expect(last.getTime() - now.getTime()).toBeLessThanOrEqual(60 * 86_400_000);
    // 60 days after Mon 2 Nov 17:00 is Fri 1 Jan 17:00: that is the last slot.
    expect([localDate(last), localTime(last)]).toEqual(["2027-01-01", "17:00"]);
  });
});

function localTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Ljubljana", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}
