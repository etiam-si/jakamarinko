import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { expect, test } from "vitest";

// Every user-facing text on the public site comes from the message files (CLAUDE.md). This flags letters written
// straight into JSX, and string literals in attributes people read or hear (alt, aria-label, title, placeholder).
const src = path.join(__dirname, "../..");
const roots = [path.join(src, "app/[locale]/(site)"), path.join(src, "components/site")];
// The T01 styleguide is an internal, unindexed page that shows sample values on purpose.
const skip = new Set([path.join(src, "app/[locale]/(site)/styleguide")]);
const spokenAttributes = new Set(["alt", "aria-label", "title", "placeholder", "caption", "label", "eyebrow", "lead"]);
const letters = /\p{L}/u;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (skip.has(full)) return [];
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return full.endsWith(".tsx") ? [full] : [];
  });
}

export function hardcodedText(code: string, fileName = "file.tsx"): string[] {
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && letters.test(node.text)) found.push(node.text.trim());
    if (ts.isJsxAttribute(node) && spokenAttributes.has(node.name.getText())) {
      const value = node.initializer;
      const literal = value && ts.isJsxExpression(value) ? value.expression : value;
      if (literal && (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal)) && letters.test(literal.text)) {
        found.push(`${node.name.getText()}="${literal.text}"`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
  return found;
}

test("no text is hard-coded in the public site", () => {
  const found = roots.flatMap(tsxFiles).flatMap((file) =>
    hardcodedText(readFileSync(file, "utf8"), file).map((text) => `${path.relative(src, file)}: ${text}`),
  );
  expect(found).toEqual([]);
});

test.each([
  ["<p>Book a test</p>", ["Book a test"]],
  ['<img alt="Jaka racing" />', ['alt="Jaka racing"']],
  ["<Button aria-label={'Open menu'} />", ['aria-label="Open menu"']],
  ["<SectionHeading eyebrow={`Lab`} />", ['eyebrow="Lab"']],
])("catches %s", (code, expected) => {
  expect(hardcodedText(code)).toEqual(expected);
});

test.each([
  "<p>{t('title')}</p>",
  "<span>0{i + 1}</span>",
  "<p>{a} · {b}</p>",
  '<div className="flex gap-2" />',
  '<img alt="" />',
])("lets %s through", (code) => {
  expect(hardcodedText(code)).toEqual([]);
});
