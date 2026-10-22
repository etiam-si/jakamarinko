import { cn } from "cn";
import { useId } from "react";

export const BRAND_NAME = "Jaka Marinko";
export const BRAND_LINE = "Endurance Performance";

// Three directions until the user picks one (see the T01 PR). The marks use theme tokens, so one SVG serves light and dark.
export const logoOptions = ["threshold", "bib", "split"] as const;
export type LogoOption = (typeof logoOptions)[number];

function Mark({ option, className }: { option: LogoOption; className?: string }) {
  const mask = useId();
  const svg = { viewBox: "0 0 32 32", "aria-hidden": true, className: cn("size-8 shrink-0", className) };

  if (option === "threshold") {
    // A lactate curve with the threshold point.
    return (
      <svg {...svg}>
        <rect width="32" height="32" rx="7" fill="var(--primary)" />
        <path d="M5.5 23.5C15 23.5 21 22.5 26.5 6.5" fill="none" stroke="var(--background)" strokeWidth="3.6" strokeLinecap="round" />
        <circle cx="19.4" cy="20.4" r="3.4" fill="var(--signal)" />
      </svg>
    );
  }
  if (option === "bib") {
    // A race number with four pin holes.
    return (
      <svg {...svg}>
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
      </svg>
    );
  }
  // A stopwatch, hand at 80 % of the dial (VO₂max 80).
  return (
    <svg {...svg}>
      <rect x="13.2" y="1" width="5.6" height="3.6" rx="1" fill="var(--primary)" />
      <circle cx="16" cy="18" r="10.6" fill="none" stroke="var(--primary)" strokeWidth="3.4" />
      <path d="M16 18 9.8 16" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="18" r="2.4" fill="var(--signal)" />
    </svg>
  );
}

function Wordmark({ option }: { option: LogoOption }) {
  if (option === "bib") {
    return (
      <span className="flex flex-col items-start">
        <span className="font-heading text-[1.6em] leading-[0.86] font-extrabold uppercase font-stretch-[70%]">
          Jaka
          <br />
          Marinko
        </span>
        <span className="mt-[0.35em] bg-foreground px-[0.6em] pt-[0.4em] pb-[0.3em] text-[0.34em] leading-none font-bold tracking-[0.22em] text-background uppercase font-stretch-[85%]">
          {BRAND_LINE}
        </span>
      </span>
    );
  }
  if (option === "split") {
    return (
      <span className="flex items-center gap-[0.6em]">
        <span className="font-heading text-[0.95em] font-semibold tracking-[0.16em] uppercase font-stretch-[108%]">{BRAND_NAME}</span>
        <span className="h-[1.2em] w-px bg-current opacity-40" />
        <span className="text-[0.36em] leading-[1.5] font-medium tracking-[0.2em] text-primary uppercase">
          Endurance
          <br />
          Performance
        </span>
      </span>
    );
  }
  return (
    <span className="flex flex-col items-start">
      <span className="font-heading text-[1.2em] leading-none font-extrabold tracking-[0.01em] uppercase font-stretch-expanded">
        {BRAND_NAME}
      </span>
      <span className="mt-[0.25em] text-[0.37em] leading-none font-medium tracking-[0.53em] text-primary uppercase">{BRAND_LINE}</span>
    </span>
  );
}

// The logo. `mark` alone for tight spaces (app bar on mobile, favicon-like spots). Size it with font-size (text-*).
export function Logo({
  option = "threshold",
  variant = "full",
  className,
}: {
  option?: LogoOption;
  variant?: "full" | "mark";
  className?: string;
}) {
  return (
    <span role="img" aria-label={`${BRAND_NAME} — ${BRAND_LINE}`} className={cn("inline-flex items-center gap-[0.6em] text-foreground", className)}>
      <Mark option={option} className="size-[2.4em]" />
      {variant === "full" && <Wordmark option={option} />}
    </span>
  );
}
