import { cn } from "cn";

// A page's h1. Hooks are often two short sentences ("Stop guessing. Train in your own zones."): each starts on its own
// line, the second in spruce, so the turn in the sentence is the turn in the type. Rises in on load with a transform
// only, so it paints at once (LCP).
export function HeroTitle({ children, className }: { children: string; className?: string }) {
  const [first, ...rest] = children.split(/(?<=[.!?])\s+/);
  return (
    <h1
      className={cn(
        "font-heading text-[2.5rem] leading-[1.02] font-extrabold tracking-[-0.015em] text-balance font-stretch-expanded motion-safe:animate-nudge sm:text-5xl lg:text-6xl",
        className,
      )}
    >
      <span className="block">{first}</span>
      {rest.length > 0 && (
        <>
          {" "}
          <span className="block text-primary">{rest.join(" ")}</span>
        </>
      )}
    </h1>
  );
}
