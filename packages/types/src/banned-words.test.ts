/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { afterTestOffer, labTests, oneOffs, packages, sessions } from "./catalog";

// Customers never read about the tools behind their plan (CLAUDE.md, "Never"). Whole words only, so "email",
// "maintain" or "automatically renews" pass; the Slovenian phrases in any case form.
const banned = [
  /(?<![\p{L}\p{N}])a\.?i\.?(?![\p{L}\p{N}])/iu,
  /artificial\s+intelligence/iu,
  /umetn\p{L}*\s+inteligenc\p{L}*/iu,
  /machine\s+learning/iu,
  /strojn\p{L}*\s+učen\p{L}*/iu,
  /algorit/iu,
];

function bannedIn(text: string): string[] {
  return banned.flatMap((re) => text.match(re)?.[0] ?? []);
}

const messagesDir = path.join(__dirname, "../../../apps/web/messages");

test("no message file mentions the banned words", () => {
  const found: string[] = [];
  for (const locale of readdirSync(messagesDir)) {
    for (const file of readdirSync(path.join(messagesDir, locale))) {
      // The privacy policy must name the AI service provider (GDPR art. 13); it's the one allowed exception.
      if (file === "legal.json") continue;
      const text = readFileSync(path.join(messagesDir, locale, file), "utf8");
      for (const word of bannedIn(text)) found.push(`${locale}/${file}: "${word}"`);
    }
  }
  expect(found).toEqual([]);
});

test("the catalog doesn't mention the banned words", () => {
  const text = JSON.stringify({ labTests, sessions, oneOffs, packages, afterTestOffer });
  expect(bannedIn(text)).toEqual([]);
});

test.each([
  "AI",
  "A.I.",
  "a.i.",
  "Your AI-powered plan",
  "(AI)",
  "Ai coach",
  "artificial intelligence",
  "Artificial  Intelligence",
  "umetna inteligenca",
  "z umetno inteligenco",
  "UMETNE INTELIGENCE",
  "machine learning",
  "strojno učenje",
  "s strojnim učenjem",
  "our algorithm",
  "Algorithms",
  "algoritem",
  "algoritmi",
])("catches %j", (text) => {
  expect(bannedIn(text)).not.toEqual([]);
});

test.each([
  "email",
  "E-mail us",
  "maintain",
  "aim",
  "said",
  "Thailand",
  "automatically renews",
  "samodejno se podaljša",
  "trail running",
  "Šmarna gora",
  "Kai",
  "aerobni prag",
])("lets %j through", (text) => {
  expect(bannedIn(text)).toEqual([]);
});
