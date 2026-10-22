import { readFileSync } from "node:fs";
import path from "node:path";

export type Theme = "light" | "dark";
export type Tokens = Record<string, string>;

function block(css: string, selector: string): Tokens {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return {};
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6});/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]));
}

// The colour tokens from theme.css, per theme. Dark inherits what it doesn't override (zones).
export function parseTheme(css: string): Record<Theme, Tokens> {
  const light = block(css, ":root");
  return { light, dark: { ...light, ...block(css, ".dark") } };
}

// Server-only: reads theme.css from the web app (cwd is apps/web for next and vitest).
export function readTheme(): Record<Theme, Tokens> {
  return parseTheme(readFileSync(path.join(process.cwd(), "src/styles/theme.css"), "utf8"));
}

// Text on background pairs every page relies on. Each must meet WCAG AA (4.5:1) in both themes.
export const textPairs: [text: string, background: string][] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary", "background"],
  ["primary", "card"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["accent-foreground", "accent"],
  ["signal-foreground", "signal"],
  ["destructive", "background"],
  ["destructive", "card"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  ["sidebar-accent-foreground", "sidebar-accent"],
  ...[1, 2, 3, 4, 5].map((n): [string, string] => [`zone-${n}-foreground`, `zone-${n}`]),
];

export const zoneTokens = [1, 2, 3, 4, 5].map((n) => `zone-${n}`);
export const chartTokens = [1, 2, 3, 4, 5].map((n) => `chart-${n}`);
