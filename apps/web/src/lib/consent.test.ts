import { expect, test } from "vitest";
import { CONSENT_VERSION, parseConsent, serializeConsent } from "./consent";

test("a saved choice reads back", () => {
  const consent = { analytics: true, marketing: false };
  expect(parseConsent(serializeConsent(consent))).toEqual(consent);
});

test("no cookie, garbage or a wrong shape means no choice yet", () => {
  expect(parseConsent(undefined)).toBeNull();
  expect(parseConsent("")).toBeNull();
  expect(parseConsent("{not json")).toBeNull();
  expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION, analytics: "yes", marketing: true }))).toBeNull();
});

test("a choice from an older version shows the banner again", () => {
  expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION - 1, analytics: true, marketing: true }))).toBeNull();
  expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION + 1, analytics: true, marketing: true }))).toBeNull();
});
