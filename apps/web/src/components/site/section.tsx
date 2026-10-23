import { cn } from "cn";

const bands = {
  // A full-width lighter band with rules, to set a section apart.
  tinted: "border-y border-border bg-card/70",
  // A full-width graphite band (the dark theme's tokens, scoped to the band): proof and results. One per page at most.
  dark: "dark bg-background text-foreground",
};

// One band of a page, on the shared max width. Fades in as it scrolls into view (components/ui/reveal.tsx);
// `reveal={false}` for sections that must not move (forms, the booking flow).
export function Section({
  className,
  children,
  tone,
  reveal = true,
  ...props
}: React.ComponentProps<"section"> & { tone?: keyof typeof bands; reveal?: boolean }) {
  const section = (
    <section
      data-reveal={reveal ? "" : undefined}
      className={cn("mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-24", className)}
      {...props}
    >
      {children}
    </section>
  );
  return tone ? <div className={bands[tone]}>{section}</div> : section;
}

// Closing call to action at the bottom of a page. `action`: one or two buttons (light on the dark band).
export function CtaBand({ title, text, action }: { title: string; text: string; action: React.ReactNode }) {
  return (
    <Section className="py-10 md:py-16">
      <div className="relative isolate flex flex-col gap-8 overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary-deep px-6 pt-10 pb-12 text-primary-foreground shadow-xl sm:px-10 md:p-14 lg:flex-row lg:items-end lg:justify-between">
        {/* Light from the top right, and the zone strip along the bottom edge. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 -right-40 -z-10 size-[36rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary-foreground)_14%,transparent),transparent)]"
        />
        <div aria-hidden className="zone-strip absolute inset-x-0 bottom-0 h-1.5" />
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="font-heading text-3xl leading-[1.05] font-extrabold tracking-tight font-stretch-expanded md:text-5xl">{title}</h2>
          <p className="text-lg text-primary-foreground/85">{text}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">{action}</div>
      </div>
    </Section>
  );
}
