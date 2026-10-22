import { expect, test } from "vitest";
import { activeEntry, nav } from "./nav";

const coach = nav.filter((e) => e.area === "coach");

test("the deepest matching entry is active", () => {
  expect(activeEntry(coach, "/coach")?.href).toBe("/coach");
  expect(activeEntry(coach, "/coach/bookings")?.href).toBe("/coach/bookings");
  expect(activeEntry(coach, "/coach/bookings/42")?.href).toBe("/coach/bookings");
  expect(activeEntry(coach, "/coach/bookingsx")?.href).toBe("/coach");
  expect(activeEntry(coach, "/account")).toBeUndefined();
});

test("every entry has a unique href inside its area", () => {
  const hrefs = nav.map((e) => e.href);
  expect(new Set(hrefs).size).toBe(hrefs.length);
  for (const e of nav) expect(e.href.startsWith(`/${e.area}`)).toBe(true);
});
