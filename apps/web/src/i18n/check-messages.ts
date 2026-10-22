import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type Messages = { [key: string]: string | Messages };

function flatten(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "string" ? [prefix + key] : flatten(value, `${prefix}${key}.`),
  );
}

// Every registered namespace must exist in every locale with exactly the same keys. Returns the problems.
export function checkMessages(dir: string, locales: readonly string[], namespaces: readonly string[]): string[] {
  const problems: string[] = [];
  const file = (locale: string, ns: string) => path.join(path.basename(dir), locale, `${ns}.json`);

  for (const locale of locales) {
    const onDisk = existsSync(path.join(dir, locale)) ? readdirSync(path.join(dir, locale)) : [];
    for (const name of onDisk) {
      const ns = name.replace(/\.json$/, "");
      if (!namespaces.includes(ns)) problems.push(`${file(locale, ns)} is not registered in src/i18n/namespaces.ts`);
    }
  }

  for (const ns of namespaces) {
    const keys = new Map<string, Set<string>>();
    for (const locale of locales) {
      const full = path.join(dir, locale, `${ns}.json`);
      if (!existsSync(full)) {
        problems.push(`${file(locale, ns)} is missing`);
        continue;
      }
      keys.set(locale, new Set(flatten(JSON.parse(readFileSync(full, "utf8")) as Messages)));
    }
    for (const [locale, own] of keys) {
      for (const [other, theirs] of keys) {
        for (const key of theirs) {
          if (!own.has(key)) problems.push(`${file(locale, ns)} is missing "${key}" (it is in ${file(other, ns)})`);
        }
      }
    }
  }
  return problems;
}
