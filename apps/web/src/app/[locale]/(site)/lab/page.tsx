import type { LabTest, LabTestId, Locale } from "@jakamarinko/types";
import { afterTestOffer, labTests, packages } from "@jakamarinko/types";
import { ArrowRight, Check, ClipboardList, Gauge, MapPin, Sparkles, TrendingUp, Trophy } from "lucide-react";
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

const what = ["s1", "s2", "s3"] as const;
const why = [
  { key: "zones", icon: Gauge },
  { key: "progress", icon: TrendingUp },
  { key: "race", icon: Trophy },
] as const;
// Which need points to which test.
const choose: [key: string, test: LabTestId][] = [
  ["lactate", "lactate-profile"],
  ["vo2max", "vo2max"],
  ["combined", "vo2max-lactate"],
  ["fatCarb", "fat-carb"],
  ["economy", "running-economy"],
  ["performance", "performance"],
];
const practical = [
  { key: "prepare", icon: ClipboardList },
  { key: "location", icon: MapPin },
  { key: "after", icon: Sparkles },
] as const;

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{title}</h4>
      <ul className="flex flex-col gap-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {item}
          </li>
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
      className={`flex scroll-mt-24 flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm md:p-8 ${featured ? "border-primary shadow-md ring-1 ring-primary" : ""}`}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-xl font-bold font-stretch-expanded md:text-2xl">{name}</h3>
          <p className="font-mono text-xs text-muted-foreground">
            {t("duration")}: {common("units.aboutMinutes", { count: test.durationMin })}
          </p>
        </div>
        <p className="font-heading text-2xl font-extrabold tracking-tight tabular-nums font-stretch-expanded md:text-3xl">
          {format.number(euros(test.priceCents), eurFormat)}
        </p>
      </header>
      <p className="text-sm text-pretty text-muted-foreground">{test.description[locale]}</p>
      <div className="grid gap-5 md:grid-cols-2">
        <List title={t("included")} items={test.included[locale]} />
        <List title={t("preparation")} items={test.preparation[locale]} />
      </div>
      <Button asChild size="lg" variant={featured ? "default" : "outline"} className="mt-auto w-full sm:w-auto sm:self-start">
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
  const testName = (id: LabTestId) => labTests.find((test) => test.id === id)!.name[locale];

  return (
    <main>
      <Section className="flex flex-col gap-8 pt-10 md:pt-16">
        <SectionHeading as="h1" eyebrow={common("nav.lab")} title={t("hero.title")} lead={t("hero.subtitle")} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/booking">
              {t("hero.primaryCta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#choose">{t("hero.secondaryCta")}</a>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {why.map(({ key, icon: Icon }) => (
            <div key={key} className="flex gap-4 rounded-xl border bg-card p-5 shadow-sm">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold">{t(`why.${key}.title`)}</h2>
                <p className="text-sm text-muted-foreground">{t(`why.${key}.text`)}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="tinted" className="grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded md:text-3xl">{t("what.title")}</h2>
          <ol className="flex flex-col gap-4">
            {what.map((key, i) => (
              <li key={key} className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm text-primary-foreground tabular-nums"
                >
                  {i + 1}
                </span>
                <p className="pt-1">{t(`what.${key}`)}</p>
              </li>
            ))}
          </ol>
        </div>
        <div id="choose" className="flex scroll-mt-24 flex-col gap-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded md:text-3xl">{t("choose.title")}</h2>
          <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
            {choose.map(([key, id]) => (
              <li key={key}>
                <a href={`#${id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm text-muted-foreground">{t(`choose.${key}`)}</span>
                    <span className="font-semibold">{testName(id)}</span>
                  </span>
                  <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
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

      <Section className="grid gap-4 pt-0 md:grid-cols-3 md:pt-0">
        {practical.map(({ key, icon: Icon }) => (
          <div key={key} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <Icon aria-hidden className="size-5" />
            </span>
            <h2 className="font-heading text-lg font-bold font-stretch-expanded">{t(`${key}.title`)}</h2>
            <p className="text-sm text-muted-foreground">{t(`${key}.text`)}</p>
            {key === "after" && (
              <p className="border-l-2 border-signal pl-3 text-sm">
                {t("after.offer", { days: afterTestOffer.planFreeDays, percent: afterTestOffer.coachingFirstMonthDiscountPercent })}
              </p>
            )}
          </div>
        ))}
      </Section>

      <CtaBand
        title={`${home("offers.coaching.title")}, ${home("offers.coaching.price", { price: format.number(euros(Math.min(...packages.map((p) => p.priceCents)))) })}`}
        text={home("offers.coaching.text")}
        action={
          <Button asChild size="lg" variant="secondary">
            <Link href="/coaching">{home("offers.coaching.cta")}</Link>
          </Button>
        }
      />
    </main>
  );
}
