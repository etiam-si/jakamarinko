import type { LabTest, Locale } from "@jakamarinko/types";
import { restedAndFasted, restedAndFed } from "@jakamarinko/types";
import { cn } from "cn";
import { ArrowRight, Check, Clock, Coffee, Moon, Sparkle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { bookingHref, eurFormat, euros } from "./site";

// A ticked list, with an optional eyebrow title. `columns`: two columns from sm up.
export function List({ title, items, columns = false }: { title?: string; items: string[]; columns?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {title && <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{title}</h4>}
      <ul className={cn("grid gap-2 text-sm", columns && "sm:grid-cols-2 sm:gap-x-8")}>
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden className="mt-px flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Check className="size-3" strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Which of the two standard preparations a test needs; the lists themselves are on the page once (PrepareCard).
function preparation(test: LabTest) {
  if (test.preparation === restedAndFasted) return { key: "fasted", icon: Moon } as const;
  if (test.preparation === restedAndFed) return { key: "fed", icon: Coffee } as const;
  return { key: "none", icon: Sparkle } as const;
}

// One lab test as a product card: name, duration and preparation, the price, what it measures and what you get,
// then "Book <test>". `featured`: the full Performance package on the graphite surface.
export function TestCard({ test, locale, featured = false, className }: { test: LabTest; locale: Locale; featured?: boolean; className?: string }) {
  const t = useTranslations("lab.tests");
  const common = useTranslations("common");
  const format = useFormatter();
  const name = test.name[locale];
  const prep = preparation(test);

  return (
    <article
      id={test.id}
      data-card="test"
      className={cn(
        "lift relative isolate flex scroll-mt-24 flex-col gap-6 overflow-hidden rounded-2xl border bg-card p-6 text-card-foreground shadow-sm md:p-8",
        featured && "dark border-primary/40 shadow-lg ring-1 ring-primary/30",
        className,
      )}
    >
      {featured && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[30rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_20%,transparent),transparent)]"
        />
      )}
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className={cn("font-heading font-bold text-balance font-stretch-expanded", featured ? "text-2xl md:text-3xl" : "text-xl md:text-2xl")}>{name}</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Clock aria-hidden className="size-3.5" />
              <span className="sr-only">{t("duration")}: </span>
              {common("units.aboutMinutes", { count: test.durationMin })}
            </li>
            <li className="flex items-center gap-1.5">
              <prep.icon aria-hidden className="size-3.5" />
              {t(`prep.${prep.key}`)}
            </li>
          </ul>
        </div>
        <p className="font-heading text-4xl leading-none font-extrabold tracking-tight tabular-nums font-stretch-expanded md:text-5xl">
          {format.number(euros(test.priceCents), eurFormat)}
        </p>
      </header>
      <p className="max-w-2xl text-pretty text-muted-foreground">{test.description[locale]}</p>
      <div className="border-t border-border pt-6">
        <List title={t("included")} items={test.included[locale]} columns={featured} />
      </div>
      <Button
        asChild
        size="lg"
        variant={featured ? "default" : "outline"}
        className="mt-auto h-auto min-h-12 w-full py-2.5 whitespace-normal sm:w-auto sm:self-start"
        data-cta="secondary"
      >
        <Link href={bookingHref(test.id)}>
          {common("actions.bookItem", { name })}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
