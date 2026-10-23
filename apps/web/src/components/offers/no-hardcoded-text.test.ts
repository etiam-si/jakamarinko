import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { hardcodedText } from "../site/no-hardcoded-text.test";

// The offers screens take every text from messages/{en,sl}/offers.json.
const src = path.join(__dirname, "../..");
const roots = [
  __dirname,
  path.join(src, "app/[locale]/(app)/coach/offers"),
  path.join(src, "app/[locale]/(site)/r"),
  path.join(src, "app/[locale]/(site)/gift"),
];

const tsxFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return full.endsWith(".tsx") ? [full] : [];
  });

test.each(roots.flatMap(tsxFiles).map((f) => [path.relative(src, f), f]))("%s has no hard-coded text", (_, file) => {
  expect(hardcodedText(readFileSync(file, "utf8"), file)).toEqual([]);
});
