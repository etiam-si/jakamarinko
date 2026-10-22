import { cn } from "cn";
import { useId } from "react";
import { wordmark } from "./wordmark-paths";

export const BRAND_NAME = "Jaka Marinko";
export const BRAND_LINE = "Endurance Performance";

// The mark: a race number with four pin holes and "JM". 32-unit grid, 2 units per pixel at 16 px.
function Mark({ mask }: { mask: string }) {
  return (
    <>
      <mask id={mask}>
        <rect width="32" height="32" fill="#fff" />
        <g fill="#000">
          <circle cx="4.3" cy="6.3" r="1.2" />
          <circle cx="27.7" cy="6.3" r="1.2" />
          <circle cx="4.3" cy="25.7" r="1.2" />
          <circle cx="27.7" cy="25.7" r="1.2" />
        </g>
      </mask>
      <rect x="1" y="3" width="30" height="26" rx="3" fill="var(--foreground)" mask={`url(#${mask})`} />
      <path d="M11.2 10v7.4a3.4 3.4 0 0 1-6.8 0" fill="none" stroke="var(--background)" strokeWidth="3.4" />
      <path d="M15.6 22.5V10h3.6l2.6 4.6 2.6-4.6H28v12.5h-3.4v-6.6l-2.8 4.5-2.8-4.5v6.6z" fill="var(--background)" />
    </>
  );
}

// Mark as tall as the wordmark, 30 % of that height between them (same layout as public/brand/logo-*.svg).
const H = wordmark.height;
const GAP = 0.3 * H;

// The logo, in theme colours. `mark` alone for tight spaces (app bar on phones, avatars). Size it by height (h-*).
// The wordmark is outlined from Archivo, so it never depends on the web font loading.
export function Logo({ variant = "full", className }: { variant?: "full" | "mark"; className?: string }) {
  const mask = useId();
  const full = variant === "full";
  return (
    <svg
      role="img"
      aria-label={`${BRAND_NAME} — ${BRAND_LINE}`}
      viewBox={full ? `0 0 ${H + GAP + wordmark.width} ${H}` : "0 0 32 32"}
      className={cn("h-12 w-auto shrink-0", className)}
    >
      <g transform={full ? `scale(${H / 32})` : undefined}>
        <Mark mask={mask} />
      </g>
      {full && (
        <g transform={`translate(${H + GAP} 0)`}>
          <path d={wordmark.name} fill="var(--foreground)" />
          <rect x={wordmark.strip.x} y={wordmark.strip.y} width={wordmark.strip.w} height={wordmark.strip.h} fill="var(--foreground)" />
          <path d={wordmark.line} fill="var(--background)" />
        </g>
      )}
    </svg>
  );
}
