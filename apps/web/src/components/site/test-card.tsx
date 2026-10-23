import type { LabTest, Locale } from "@jakamarinko/types";
import { restedAndFasted, restedAndFed, separatePrice } from "@jakamarinko/types";
import { cn } from "cn";
import { ArrowRight, Check, ChevronDown, Clock, Coffee, Moon, Sparkle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { bookingHref, euro, euros } from "./site";

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
// then "Book <test>". Bundles show what the same costs booked one by one and the saving (our own prices, not a
// reduction, so nothing is struck through). `featured`: the hero bundle on the graphite surface. `badge`: one or two
// words on why to pick it ("Best value").
export function TestCard({
  test,
  locale,
  featured = false,
  badge,
  className,
}: {
  test: LabTest;
  locale: Locale;
  featured?: boolean;
  badge?: string;
  className?: string;
}) {
  const t = useTranslations("lab.tests");
  const common = useTranslations("common");
  const format = useFormatter();
  const name = test.name[locale];
  const prep = preparation(test);
  const compared = separatePrice(test);
  const plain = (cents: number) => format.number(euros(cents), { maximumFractionDigits: 2 });

  return (
    <article
      id={test.id}
      data-card="test"
      className={cn(
        "lift relative isolate flex scroll-mt-24 flex-col gap-5 overflow-hidden rounded-2xl border bg-card p-5 text-card-foreground shadow-sm md:p-7",
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
      {badge && (
        <p className="-mb-1 flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs tracking-wide whitespace-nowrap text-primary uppercase">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-signal" />
          {badge}
        </p>
      )}
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className={cn("font-heading font-bold text-balance font-stretch-expanded", featured ? "text-2xl md:text-3xl" : "text-lg md:text-xl")}>{name}</h3>
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
        <p className="shrink-0 font-heading text-3xl leading-none font-extrabold tracking-tight tabular-nums font-stretch-expanded md:text-4xl">
          {euro(format, test.priceCents)}
        </p>
      </header>
      {compared && (
        <p className="-mt-2 text-sm font-medium text-primary tabular-nums">
          {t("separately", { price: plain(compared.separateCents), saving: plain(compared.savingCents) })}
        </p>
      )}
      {/* What it measures and what you get, one tap away, so the price list stays short on a phone. Not a FAQ row,
          so it carries its own group (the FAQ's structured data lists only .faq rows). */}
      <details className="group/more border-t border-border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 pt-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          {t("included")}
          <ChevronDown aria-hidden className="size-4 text-muted-foreground transition-transform duration-(--duration-base) group-open/more:rotate-180" />
        </summary>
        <div className="flex flex-col gap-4 pt-3">
          <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{test.description[locale]}</p>
          <List items={test.included[locale]} columns={featured} />
        </div>
      </details>
      <Button asChild variant={featured ? "default" : "outline"} className="mt-auto h-auto min-h-11 w-full py-2 whitespace-normal" data-cta="secondary">
        <Link href={bookingHref(test.id)}>
          {common("actions.bookItem", { name })}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </article>
  );
}

// The single tests and the come-back offers as one compact list: name, time, price (and the saving), what you get one
// tap away, and Book. The cards above carry the bundles we recommend; this keeps the price list short on a phone.
export function TestList({ tests, locale }: { tests: LabTest[]; locale: Locale }) {
  const t = useTranslations("lab.tests");
  const common = useTranslations("common");
  const format = useFormatter();
  const plain = (cents: number) => format.number(euros(cents), { maximumFractionDigits: 2 });
  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border bg-card shadow-sm">
      {tests.map((test) => {
        const name = test.name[locale];
        const prep = preparation(test);
        const compared = separatePrice(test);
        return (
          <li key={test.id} id={test.id} data-card="test" className="flex scroll-mt-24 flex-col gap-3 p-4 md:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <h3 className="font-heading text-base font-bold text-balance font-stretch-expanded md:text-lg">{name}</h3>
                <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock aria-hidden className="size-3.5" />
                    <span className="sr-only">{t("duration")}: </span>
                    {common("units.aboutMinutes", { count: test.durationMin })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <prep.icon aria-hidden className="size-3.5" />
                    {t(`prep.${prep.key}`)}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="font-heading text-2xl leading-none font-extrabold tracking-tight tabular-nums font-stretch-expanded">{euro(format, test.priceCents)}</p>
              </div>
            </div>
            {compared && (
              <p className="text-sm font-medium text-primary tabular-nums">
                {t("separately", { price: plain(compared.separateCents), saving: plain(compared.savingCents) })}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <details className="group/more min-w-0 flex-1">
                <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {t("included")}
                  <ChevronDown aria-hidden className="size-4 text-muted-foreground transition-transform duration-(--duration-base) group-open/more:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 pt-1 pb-2">
                  <p className="max-w-xl text-sm text-pretty text-muted-foreground">{test.description[locale]}</p>
                  <List items={test.included[locale]} />
                </div>
              </details>
              <Button asChild variant="outline" className="h-auto min-h-11 w-full shrink-0 py-2 whitespace-normal sm:w-auto" data-cta="secondary">
                <Link href={bookingHref(test.id)}>
                  {common("actions.bookItem", { name })}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
