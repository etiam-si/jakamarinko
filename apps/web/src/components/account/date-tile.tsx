import { cn } from "cn";
import { useLocale } from "next-intl";
import type { Locale } from "@jakamarinko/types";

const intl: Record<Locale, string> = { en: "en-GB", sl: "sl-SI" };
const pins = ["top-1.5 left-1.5", "top-1.5 right-1.5", "bottom-1.5 left-1.5", "bottom-1.5 right-1.5"];

// The day of a booking printed like a race number: month, the day large, weekday, with the bib's four pin holes.
// `muted` for bookings that are over. Decorative next to the written date, so hidden from screen readers.
export function DateTile({ iso, size = "md", muted = false }: { iso: string; size?: "md" | "lg"; muted?: boolean }) {
  const locale = useLocale() as Locale;
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intl[locale], { timeZone: "Europe/Ljubljana", ...options }).format(new Date(iso));
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-center rounded-xl leading-none tabular-nums",
        muted ? "bg-muted text-muted-foreground" : "bg-foreground text-background shadow-md",
        size === "lg" ? "h-28 w-24 gap-1.5" : "h-[4.5rem] w-16 gap-1",
      )}
    >
      {pins.map((p) => (
        <span key={p} className={cn("absolute size-1 rounded-full", muted ? "bg-background" : "bg-background/90", p)} />
      ))}
      <span className="font-mono text-xs tracking-wider uppercase opacity-80">{part({ month: "short" }).replace(".", "")}</span>
      <span className={cn("font-heading font-extrabold tracking-tight font-stretch-expanded", size === "lg" ? "text-4xl" : "text-2xl")}>
        {part({ day: "numeric" })}
      </span>
      <span className="font-mono text-xs tracking-wider uppercase opacity-80">{part({ weekday: "short" }).replace(".", "")}</span>
    </span>
  );
}
