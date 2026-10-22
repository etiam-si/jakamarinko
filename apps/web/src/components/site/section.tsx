import { cn } from "cn";

// One band of a page, on the shared max width. `tinted`: a full-width lighter band with rules, to set a section apart.
export function Section({ className, children, tinted = false, ...props }: React.ComponentProps<"section"> & { tinted?: boolean }) {
  const section = (
    <section className={cn("mx-auto w-full max-w-6xl px-4 py-14 md:px-8 md:py-20", className)} {...props}>
      {children}
    </section>
  );
  return tinted ? <div className="border-y border-border bg-card/60">{section}</div> : section;
}

// Closing call to action at the bottom of a page. `action`: one or two buttons (light on the dark band).
export function CtaBand({ title, text, action }: { title: string; text: string; action: React.ReactNode }) {
  return (
    <Section>
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary-deep p-8 text-primary-foreground shadow-lg md:flex-row md:items-center md:justify-between md:p-12">
        <div className="flex max-w-xl flex-col gap-2">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-balance font-stretch-expanded md:text-3xl">{title}</h2>
          <p className="text-primary-foreground/85">{text}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">{action}</div>
      </div>
    </Section>
  );
}
