import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { hardcodedText } from "../site/no-hardcoded-text.test";

// The coach booking screens take every text from messages/{en,sl}/coach-booking.json too.
const src = path.join(__dirname, "../..");
const coach = path.join(src, "app/[locale]/(app)/coach");
const roots = [__dirname, ...["bookings", "settings"].map((p) => path.join(coach, p))];

const tsxFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return full.endsWith(".tsx") ? [full] : [];
  });

test.each([...roots.flatMap(tsxFiles), path.join(coach, "page.tsx")].map((f) => [path.relative(src, f), f]))(
  "%s has no hard-coded text",
  (_, file) => {
    expect(hardcodedText(readFileSync(file, "utf8"), file)).toEqual([]);
  },
);
