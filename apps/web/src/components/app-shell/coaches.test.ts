import { expect, test } from "vitest";
import { showCoachSwitcher } from "./coaches";

const jaka = { id: "1", name: "Jaka" };
const ana = { id: "2", name: "Ana" };

test("only head coach and owner get the switcher, and only with more than one coach", () => {
  expect(showCoachSwitcher("head_coach", [jaka, ana])).toBe(true);
  expect(showCoachSwitcher("owner", [jaka, ana])).toBe(true);
  expect(showCoachSwitcher("owner", [jaka])).toBe(false);
  expect(showCoachSwitcher("coach", [jaka, ana])).toBe(false);
  expect(showCoachSwitcher("customer", [jaka, ana])).toBe(false);
});
