/// <reference types="node" />
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { locales } from "./enums";
import { labTests, oneOffs, packages, sessions, type Localized, type LocalizedList } from "./catalog";

const docs = path.join(__dirname, "../../../docs");
const items = [...labTests, ...sessions, ...oneOffs, ...packages];

function texts(item: object): (Localized | LocalizedList)[] {
  return Object.values(item).filter(
    (v): v is Localized | LocalizedList => typeof v === "object" && v !== null && "en" in v,
  );
}

describe("every item", () => {
  test.each(items.map((item) => [item.id, item] as const))("%s has every text in both languages", (_, item) => {
    for (const text of texts(item)) {
      for (const locale of locales) {
        const value = text[locale];
        if (Array.isArray(value)) {
          expect(value.length).toBeGreaterThan(0);
          expect(value.length).toBe((text as LocalizedList).en.length);
          for (const line of value) expect(line.trim()).not.toBe("");
        } else {
          expect(value.trim()).not.toBe("");
        }
      }
    }
  });

  test("ids are unique", () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  test("every price is a positive integer number of cents", () => {
    for (const item of items) {
      expect(Number.isInteger(item.priceCents) && item.priceCents > 0, item.id).toBe(true);
    }
    for (const p of packages) expect(Number.isInteger(p.yearlyPriceCents) && p.yearlyPriceCents > 0).toBe(true);
  });


  test("bookable durations are positive whole minutes", () => {
    for (const s of [...labTests, ...sessions]) expect(Number.isInteger(s.durationMin) && s.durationMin > 0).toBe(true);
  });
});

describe("prices match the docs", () => {
  // The lab price list in docs/content/jaka-marinko.md, by its Slovenian names.
  const labNames: Record<string, string> = {
    "VO₂max": "vo2max",
    "Laktatni profil": "lactate-profile",
    "VO₂max + laktat": "vo2max-lactate",
    "Analiza porabe maščob in OH": "fat-carb",
    "Ekonomičnost teka": "running-economy",
    Antropometrija: "anthropometry",
    "Performance paket": "performance",
  };

  test("lab tests", () => {
    const content = readFileSync(path.join(docs, "content/jaka-marinko.md"), "utf8");
    const rows = [...content.matchAll(/^\| \**(.+?)\** \| \**(\d+) €\** \|$/gm)];
    expect(rows.length).toBe(labTests.length);
    for (const [, name, euros] of rows) {
      const test = labTests.find((t) => t.id === labNames[name!]);
      expect(test, name).toBeDefined();
      expect(test!.priceCents, name).toBe(Number(euros) * 100);
    }
  });

  test("lab tests, as repeated in docs/product.md", () => {
    const product = readFileSync(path.join(docs, "product.md"), "utf8");
    const line = product.match(/\*\*Lab tests\*\* at the existing prices \((.+?)\)/)![1]!;
    const euros = [...line.matchAll(/(\d+) €/g)].map((m) => Number(m[1]) * 100);
    expect(euros).toEqual(
      ["vo2max", "lactate-profile", "vo2max-lactate", "fat-carb", "running-economy", "anthropometry", "performance"].map(
        (id) => labTests.find((t) => t.id === id)!.priceCents,
      ),
    );
  });

  test("packages, personal training and the yearly price", () => {
    const product = readFileSync(path.join(docs, "product.md"), "utf8");
    const row = product.match(/^\| Rough price \|(.+)\|$/m)![1]!;
    const monthly = [...row.matchAll(/(\d+) €\/mo/g)].map((m) => Number(m[1]) * 100);
    expect(packages.map((p) => p.priceCents)).toEqual(monthly);
    expect(product).toContain("Paying a year up front: 2 months free.");
    for (const p of packages) expect(p.yearlyPriceCents).toBe(p.priceCents * 10);

    const session = Number(product.match(/one session (\d+) €/)![1]) * 100;
    expect(sessions.find((s) => s.id === "personal-training")!.priceCents).toBe(session);
  });

  test("minimum terms and the Plan discount", () => {
    expect(packages.filter((p) => p.minimumMonths === 3).map((p) => p.id)).toEqual(["coaching", "elite"]);
    expect(packages.find((p) => p.id === "plan")!.labDiscountPercent).toBe(20);
  });
});

describe("combined tests and credits", () => {
  const bookable = new Set<string>([...labTests, ...sessions].map((s) => s.id));
  const labIds = new Set<string>(labTests.map((t) => t.id));

  test("every credit rule references an existing test or session", () => {
    for (const p of packages) {
      for (const rule of p.credits) {
        expect(bookable.has(rule.serviceId), `${p.id} → ${rule.serviceId}`).toBe(true);
        expect(Number.isInteger(rule.count) && rule.count > 0).toBe(true);
        expect(Number.isInteger(rule.everyMonths) && rule.everyMonths > 0).toBe(true);
      }
    }
  });

  test("combined tests contain existing single tests", () => {
    for (const t of labTests) {
      for (const id of t.contains ?? []) {
        expect(labIds.has(id) && id !== t.id, `${t.id} → ${id}`).toBe(true);
        expect(labTests.find((x) => x.id === id)!.contains).toBeUndefined();
      }
    }
  });
});
