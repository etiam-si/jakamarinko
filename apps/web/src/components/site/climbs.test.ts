import { expect, test } from "vitest";
import en from "../../../messages/en/about.json";
import sl from "../../../messages/sl/about.json";
import { climbsFrom, toSeconds, toTime } from "./climbs";

test("times convert both ways", () => {
  expect(toSeconds("13:47")).toBe(827);
  expect(toTime(827)).toBe("13:47");
  expect(toTime(toSeconds("12:05"))).toBe("12:05");
});

test("the chart data is sorted by age and the same in both languages", () => {
  const climbs = climbsFrom(en.smarnaGora.times);
  expect(climbs.map((c) => c.age)).toEqual([12, 13, 14, 15, 16, 17, 18, 19]);
  expect(climbs[0]).toEqual({ age: 12, seconds: 911 });
  expect(climbsFrom(sl.smarnaGora.times)).toEqual(climbs);
});
