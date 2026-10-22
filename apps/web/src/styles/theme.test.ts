import { describe, expect, it } from "vitest";
import { contrast, deuteranopia, distance, linearRgb } from "./color";
import { chartTokens, readTheme, textPairs, zoneTokens } from "./tokens";

const themes = readTheme();
// OKLab distance: ~0.02 is barely noticeable, 0.1 is clearly a different colour.
const DISTINCT = 0.1;

describe.each(["light", "dark"] as const)("%s theme", (theme) => {
  const t = themes[theme];

  it.each(textPairs)("%s on %s meets WCAG AA", (text, bg) => {
    expect(t[text], text).toBeDefined();
    expect(t[bg], bg).toBeDefined();
    expect(contrast(t[text]!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["zone", zoneTokens],
    ["chart", chartTokens],
  ] as const)("%s colours stay apart with normal vision and deuteranopia", (_, tokens) => {
    for (const [i, a] of tokens.entries()) {
      for (const b of tokens.slice(i + 1)) {
        expect(distance(linearRgb(t[a]!), linearRgb(t[b]!)), `${a} vs ${b}`).toBeGreaterThan(DISTINCT);
        expect(distance(deuteranopia(t[a]!), deuteranopia(t[b]!)), `${a} vs ${b} (deuteranopia)`).toBeGreaterThan(DISTINCT);
      }
    }
  });
});

describe("colour maths", () => {
  it("matches known WCAG ratios", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });
});
