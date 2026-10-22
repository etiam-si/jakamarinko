import { cn } from "cn";

const holes = ["top-[3px] left-[3px]", "top-[3px] right-[3px]", "bottom-[3px] left-[3px]", "bottom-[3px] right-[3px]"];

// Someone's initials on a small race bib, the logo's shape: the avatar of a signed-in person. Decorative: the button
// around it carries the name.
export function BibAvatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex h-7 w-9 shrink-0 items-center justify-center rounded-[5px] bg-foreground font-heading text-[0.8125rem] leading-none font-extrabold tracking-tight text-background font-stretch-expanded",
        className,
      )}
    >
      {holes.map((h) => (
        <span key={h} className={cn("absolute size-[3px] rounded-full bg-background", h)} />
      ))}
      {initials}
    </span>
  );
}
