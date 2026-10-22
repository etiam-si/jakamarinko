import { Medal, Quote } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@jakamarinko/types";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { Section } from "./section";
import { shownTestimonials } from "./testimonials";

const results = ["worldXc", "europeanMountain", "worldMountain", "worldSkimo", "champion", "redBull"] as const;

// Proof from people. Real quotes (components/site/testimonials.ts) when there are any; the samples only in
// placeholder builds, badged "Sample". Until then: Jaka's own results, which are real. `action`: the section's CTA.
export function TestimonialsSection({ action }: { action: React.ReactNode }) {
  const t = useTranslations("site.testimonials");
  const about = useTranslations("about.achievements");
  const common = useTranslations("common.sports");
  const locale = useLocale() as Locale;

  if (shownTestimonials.length === 0) {
    return (
      <Section className="flex flex-col gap-12">
        <SectionHeading title={about("title")} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((key, i) => (
            <li
              key={key}
              data-reveal-item
              style={{ "--i": i } as React.CSSProperties}
              className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Medal aria-hidden className="size-5" />
              </span>
              <p className="pt-2 text-sm font-medium">{about(key)}</p>
            </li>
          ))}
        </ul>
        <div className="flex">{action}</div>
      </Section>
    );
  }

  return (
    <Section className="flex flex-col gap-12">
      <SectionHeading title={t("title")} />
      <ul className="grid gap-4 md:grid-cols-3">
        {shownTestimonials.map((item, i) => {
          const name = item.name ?? t("sampleName");
          return (
            <li
              key={item.id}
              data-reveal-item
              style={{ "--i": i } as React.CSSProperties}
              className="lift flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm md:p-7"
            >
              <Quote aria-hidden className="size-7 text-primary/30" />
              <blockquote className="text-lg leading-relaxed text-pretty">{item.quote[locale]}</blockquote>
              <footer className="mt-auto flex items-center gap-3 border-t pt-5">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-sm font-bold text-secondary-foreground"
                >
                  {name.charAt(0)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold">{name}</span>
                  <span className="text-sm text-muted-foreground">{common(item.sport)}</span>
                </span>
                {item.sample && (
                  <StatusBadge tone="warning" className="self-start" data-sample-badge>
                    {t("sample")}
                  </StatusBadge>
                )}
              </footer>
            </li>
          );
        })}
      </ul>
      <div className="flex">{action}</div>
    </Section>
  );
}
