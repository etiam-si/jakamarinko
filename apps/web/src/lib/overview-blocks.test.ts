import { expect, test } from "vitest";
import en from "../../messages/en/account.json";
import sl from "../../messages/sl/account.json";
import enOffers from "../../messages/en/offers.json";
import slOffers from "../../messages/sl/offers.json";
import { overviewBlocks } from "./overview-blocks";

const lookup = (messages: object, key: string) =>
  key.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), messages);

// A block's title is a full message key, in its feature's namespace.
const namespaces: Record<string, [object, object]> = { account: [en, sl], offers: [enOffers, slOffers] };

test("every block has a unique id and a title in both languages", () => {
  const ids = overviewBlocks.map((b) => b.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const { title } of overviewBlocks) {
    const [ns, ...rest] = title.split(".");
    const messages = namespaces[ns!];
    expect(messages, title).toBeDefined();
    expect(lookup(messages![0], rest.join(".")), title).toEqual(expect.any(String));
    expect(lookup(messages![1], rest.join(".")), title).toEqual(expect.any(String));
  }
});

test("phase 1 blocks, in order", () => {
  expect(overviewBlocks.map((b) => b.id)).toEqual(["next-booking", "past-bookings", "profile", "referral"]);
});
