import type { LabTest, Locale } from "@jakamarinko/types";
import { afterTestOffer, labTests, packages } from "@jakamarinko/types";
import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SectionHeading } from "@/components/brand/section-heading";
import { CtaBand, Section } from "@/components/site/section";
import { bookingHref, eurFormat, euros, pageMetadata } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lab.meta" });
  return pageMetadata(locale, "/lab", { title: t("title"), description: t("description") });
}

const why = ["zones", "progress", "race"] as const;
const choose = ["lactate", "vo2max", "combined", "fatCarb", "economy", "performance"] as const;

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{title}</h4>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm marker:text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TestCard({ test, locale, featured = false }: { test: LabTest; locale: Locale; featured?: boolean }) {
  const t = useTranslations("lab.tests");
  const common = useTranslations("common");
  const format = useFormatter();
  const name = test.name[locale];

  return (
    <article
      id={test.id}
      className={`flex scroll-mt-20 flex-col gap-6 rounded-lg bg-card p-6 ring-1 md:p-8 ${featured ? "ring-2 ring-primary" : "ring-border"}`}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-2xl font-bold font-stretch-expanded">{name}</h3>
          <p className="font-mono text-xs text-muted-foreground">
            {t("duration")}: {common("units.aboutMinutes", { count: test.durationMin })}
          </p>
        </div>
        <p className="font-heading text-3xl font-extrabold tracking-tight tabular-nums font-stretch-expanded">
          {format.number(euros(test.priceCents), eurFormat)}
        </p>
      </header>
      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("measures")}</h4>
        <p className="text-pretty">{test.description[locale]}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <List title={t("included")} items={test.included[locale]} />
        <List title={t("preparation")} items={test.preparation[locale]} />
      </div>
      <Button asChild size="lg" variant={featured ? "default" : "outline"} className="self-start px-5">
        <Link href={bookingHref(test.id)}>{common("actions.bookItem", { name })}</Link>
      </Button>
    </article>
  );
}

export default function Lab({ params }: Props) {
  const locale = use(params).locale as Locale;
  setRequestLocale(locale);
  const t = useTranslations("lab");
  const common = useTranslations("common");
  const home = useTranslations("home");
  const format = useFormatter();
  const singles = labTests.filter((test) => test.id !== "performance");
  const performance = labTests.find((test) => test.id === "performance")!;

  return (
    <main>
      <Section className="flex flex-col gap-10 pt-10 md:pt-16">
        <SectionHeading as="h1" eyebrow={common("nav.lab")} title={t("hero.title")} lead={t("hero.subtitle")} />
        <div className="grid gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded">{t("what.title")}</h2>
            <p className="text-pretty text-muted-foreground">{t("what.text")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded">{t("why.title")}</h2>
            <ul className="flex flex-col gap-2">
              {why.map((key) => (
                <li key={key} className="flex gap-3 text-muted-foreground">
                  <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-foreground" />
                  {t(`why.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="flex flex-col gap-6 border-t border-border">
        <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded md:text-3xl">{t("choose.title")}</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {choose.map((key) => (
            <li key={key} className="rounded-md bg-secondary px-4 py-3 text-sm text-secondary-foreground">
              {t(`choose.${key}`)}
            </li>
          ))}
        </ul>
      </Section>

      <Section className="flex flex-col gap-8">
        <SectionHeading title={t("tests.title")} lead={common("units.vatIncluded")} />
        <TestCard test={performance} locale={locale} featured />
        <div className="grid gap-6 lg:grid-cols-2">
          {singles.map((test) => (
            <TestCard key={test.id} test={test} locale={locale} />
          ))}
        </div>
      </Section>

      <Section className="grid gap-10 border-t border-border md:grid-cols-3">
        {(["prepare", "location", "after"] as const).map((key) => (
          <div key={key} className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold font-stretch-expanded">{t(`${key}.title`)}</h2>
            <p className="text-muted-foreground">{t(`${key}.text`)}</p>
            {key === "after" && (
              <p className="border-l-2 border-signal pl-3">
                {t("after.offer", { days: afterTestOffer.planFreeDays, percent: afterTestOffer.coachingFirstMonthDiscountPercent })}
              </p>
            )}
          </div>
        ))}
      </Section>

      <CtaBand
        title={home("offers.coaching.title")}
        text={home("offers.coaching.text", { price: format.number(euros(Math.min(...packages.map((p) => p.priceCents)))) })}
        action={
          <Button asChild size="lg" variant="secondary" className="h-11 shrink-0 px-5 text-base">
            <Link href="/coaching">{home("offers.coaching.cta")}</Link>
          </Button>
        }
      />
    </main>
  );
}
