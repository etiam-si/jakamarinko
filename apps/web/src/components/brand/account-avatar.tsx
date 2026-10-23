import { cn } from "cn";

// A signed-in person: their initials in a round spruce chip. Round on purpose, so it never reads as the logo's
// square bib. Decorative: the button around it carries the name.
export function AccountAvatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[0.8125rem] leading-none font-semibold tracking-wide text-primary-foreground ring-2 ring-background",
        className,
      )}
    >
      {initials}
    </span>
  );
}
