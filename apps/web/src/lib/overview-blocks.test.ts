import { expect, test } from "vitest";
import en from "../../messages/en/account.json";
import sl from "../../messages/sl/account.json";
import { overviewBlocks } from "./overview-blocks";

const lookup = (messages: object, key: string) =>
  key.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), messages);

test("every block has a unique id and a title in both languages", () => {
  const ids = overviewBlocks.map((b) => b.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const { title } of overviewBlocks) {
    expect(title.startsWith("account.")).toBe(true);
    const key = title.slice("account.".length);
    expect(lookup(en, key), title).toEqual(expect.any(String));
    expect(lookup(sl, key), title).toEqual(expect.any(String));
  }
});

test("phase 1 blocks, in order", () => {
  expect(overviewBlocks.map((b) => b.id)).toEqual(["next-booking", "past-bookings", "profile"]);
});
