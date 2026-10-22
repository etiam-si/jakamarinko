import { cn } from "cn";

// One band of a page, on the shared max width.
export function Section({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section className={cn("mx-auto w-full max-w-6xl px-4 py-14 md:px-8 md:py-20", className)} {...props}>
      {children}
    </section>
  );
}

// Closing call to action at the bottom of a page.
export function CtaBand({ title, text, action }: { title: string; text: string; action: React.ReactNode }) {
  return (
    <Section>
      <div className="flex flex-col gap-6 rounded-lg bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-12">
        <div className="flex max-w-xl flex-col gap-2">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-balance font-stretch-expanded md:text-3xl">{title}</h2>
          <p className="text-primary-foreground/85">{text}</p>
        </div>
        {action}
      </div>
    </Section>
  );
}
