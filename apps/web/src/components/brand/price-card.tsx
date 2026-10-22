import { cn } from "cn";
import { Check } from "lucide-react";

// A test or package with its price. `price` comes formatted for the locale (useFormatter().number(…, { style: "currency" })).
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
      className={cn(
        "flex flex-col gap-5 rounded-xl border bg-card p-6 text-card-foreground shadow-sm",
        featured && "border-primary shadow-md ring-1 ring-primary",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg font-bold font-stretch-expanded">{name}</h3>
        {badge && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 whitespace-nowrap bg-primary/10 px-2.5 py-1 font-mono text-[0.65rem] tracking-wider text-primary uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {badge}
          </span>
        )}
      </header>
      <p className="flex items-baseline gap-1.5">
        <span className="font-heading text-4xl font-extrabold tracking-tight tabular-nums font-stretch-expanded">{price}</span>
        {period && <span className="text-sm text-muted-foreground">{period}</span>}
      </p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {features && features.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      )}
      {action && <div className="mt-auto pt-2">{action}</div>}
    </article>
  );
}
