import { cn } from "cn";
import { HeroTitle } from "./hero-title";

const sizes = {
  h2: "text-3xl leading-[1.08] font-bold md:text-[2.75rem]",
  h3: "text-xl leading-snug font-bold md:text-2xl",
};

// Eyebrow + title + optional lead. The eyebrow's signal dot is the brand's one accent: use it once per section.
export function SectionHeading({
  eyebrow,
  title,
  lead,
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-4", className)}>
      {eyebrow && (
        <p className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-signal" />
          {eyebrow}
        </p>
      )}
      {Tag === "h1" ? (
        <HeroTitle>{title}</HeroTitle>
      ) : (
        <Tag className={cn("font-heading tracking-tight text-balance font-stretch-expanded", sizes[Tag])}>{title}</Tag>
      )}
      {lead && (
        <p data-subline={Tag === "h1" ? "" : undefined} className="text-lg text-pretty text-muted-foreground md:text-xl">
          {lead}
        </p>
      )}
    </div>
  );
}
