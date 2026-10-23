import { expect, test } from "vitest";
import { pickMessages } from "./pick-messages";

const messages = { common: { nav: { home: "Home" }, actions: { book: "Book" } }, legal: { title: "Privacy" }, errors: { error: { retry: "Try again" }, notFound: { title: "Lost" } } };

test("takes whole namespaces and single branches, and leaves the rest out", () => {
  expect(pickMessages(messages, ["common", "errors.error"])).toEqual({
    common: messages.common,
    errors: { error: { retry: "Try again" } },
  });
});

test("skips paths that don't exist and doesn't change the source", () => {
  const before = structuredClone(messages);
  expect(pickMessages(messages, ["nope", "common.nope", "common", "common.nav"])).toEqual({ common: messages.common });
  expect(messages).toEqual(before);
});
