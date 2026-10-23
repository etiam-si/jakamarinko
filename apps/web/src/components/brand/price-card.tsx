import { cn } from "cn";
import { Check } from "lucide-react";

// A test or package with its price, built like a product card: name and badge, a big price, one line on who it's
// for, what's included, then the action at the bottom. `price` comes formatted for the locale
// (useFormatter().number(…, { style: "currency" })). `featured`: the one card we recommend, on the graphite surface
// (the dark theme's tokens, scoped to the card). Lifts on hover.
export function PriceCard({
  name,
  price,
  period,
  description,
  features,
  badge,
  featured = false,
  action,
  className,
}: {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features?: string[];
  badge?: string;
  featured?: boolean;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      data-card="price"
      className={cn(
        "lift relative isolate flex flex-col overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-sm md:p-7",
        featured && "dark border-primary/40 shadow-lg ring-1 ring-primary/30",
        className,
      )}
    >
      {featured && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-64 w-[130%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
        />
      )}
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg leading-snug font-bold font-stretch-expanded">{name}</h3>
        {badge && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs tracking-wider whitespace-nowrap text-primary uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {badge}
          </span>
        )}
      </header>
      <p className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-heading text-5xl leading-none font-extrabold tracking-tight tabular-nums font-stretch-expanded">{price}</span>
        {period && <span className="text-sm text-muted-foreground">{period}</span>}
      </p>
      {description && <p className="mt-3 text-sm text-muted-foreground">{description}</p>}
      {features && features.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2.5 border-t border-border pt-6 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2.5">
              <span aria-hidden className="mt-px flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      )}
      {action && <div className="mt-auto pt-7">{action}</div>}
    </article>
  );
}
