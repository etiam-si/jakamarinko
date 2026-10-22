import { cn } from "cn";

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
    <div className={cn("flex max-w-2xl flex-col gap-3", className)}>
      {eyebrow && (
        <p className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-signal" />
          {eyebrow}
        </p>
      )}
      <Tag
        className={cn(
          "font-heading font-bold tracking-tight text-balance font-stretch-expanded",
          Tag === "h1" ? "text-4xl md:text-5xl" : Tag === "h2" ? "text-3xl md:text-4xl" : "text-xl md:text-2xl",
        )}
      >
        {title}
      </Tag>
      {lead && <p className="text-lg text-pretty text-muted-foreground">{lead}</p>}
    </div>
  );
}
