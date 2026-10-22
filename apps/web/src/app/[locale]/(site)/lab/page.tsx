import type { LabTestId, Locale } from "@jakamarinko/types";
import { afterTestOffer, labTests, packages, restedAndFed } from "@jakamarinko/types";
import { ArrowRight, Check, ClipboardList, MapPin, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { LactateCurve } from "@/components/brand/lactate-curve";
import { SectionHeading } from "@/components/brand/section-heading";
import { Faq } from "@/components/site/faq";
import { PhotoSlot } from "@/components/site/photo-slot";
import { ProofBand } from "@/components/site/proof-band";
import { CtaBand, Section } from "@/components/site/section";
import { euros, pageMetadata } from "@/components/site/site";
import { Steps } from "@/components/site/steps";
import { List, TestCard } from "@/components/site/test-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lab.meta" });
  return pageMetadata(locale, "/lab", { title: t("title"), description: t("description") });
}

const what = ["s1", "s2", "s3"] as const;
const why = ["zones", "progress", "race"] as const;
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
const faq = ["prepare", "fit", "duration", "results", "cancel"] as const;

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
  const minutes = labTests.map((test) => test.durationMin);

  const book = (variant: "default" | "outline" = "outline") => (
    <Button asChild size="lg" variant={variant} data-cta="secondary">
      <Link href="/booking">
        {common("actions.bookTest")}
        <ArrowRight aria-hidden />
      </Link>
    </Button>
  );

  return (
    <main>
      <Section
        reveal={false}
        className="grid items-center gap-12 pt-8 pb-16 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 lg:pt-20 lg:pb-24"
      >
        <div className="flex flex-col gap-8">
          <SectionHeading as="h1" eyebrow={common("nav.lab")} title={t("hero.title")} lead={t("hero.subtitle")} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" data-cta="primary">
              <Link href="/booking">
                {t("hero.primaryCta")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#choose">{t("hero.secondaryCta")}</a>
            </Button>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm">
            {why.map((key) => (
              <li key={key} className="flex items-start gap-2.5">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold">{t(`why.${key}.title`)}.</span>{" "}
                  <span className="text-muted-foreground">{t(`why.${key}.text`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <PhotoSlot
          slot="labHero"
          className="mx-auto max-w-md lg:max-w-none"
          fallback={
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div aria-hidden className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-2xl bg-linear-to-br from-primary to-primary-deep md:translate-x-4 md:translate-y-4" />
              <div className="relative mr-2.5 rounded-2xl border bg-card p-5 shadow-xl md:mr-4 md:p-7">
                <p className="mb-5 flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  <span aria-hidden className="size-1.5 rounded-full bg-signal" />
                  {testName("lactate-profile")}
                </p>
                <LactateCurve labels={{ x: t("curve.x"), y: t("curve.y") }} />
              </div>
            </div>
          }
        />
      </Section>

      <ProofBand action={book()} />

      <Section id="tests" className="flex scroll-mt-20 flex-col gap-10">
        <SectionHeading title={t("tests.title")} lead={common("units.vatIncluded")} />
        <TestCard test={performance} locale={locale} featured />
        <div className="grid gap-6 lg:grid-cols-2">
          {singles.map((test) => (
            <TestCard key={test.id} test={test} locale={locale} />
          ))}
        </div>
      </Section>

      <Section tone="tinted" className="grid gap-14 md:grid-cols-2 md:gap-12">
        <div className="flex flex-col gap-10">
          <SectionHeading title={t("what.title")} />
          <Steps vertical items={what.map((key) => ({ text: t(`what.${key}`) }))} />
        </div>
        <div id="choose" className="flex scroll-mt-24 flex-col gap-8">
          <SectionHeading title={t("choose.title")} />
          <ul className="flex flex-col divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
            {choose.map(([key, id]) => (
              <li key={key}>
                <a href={`#${id}`} className="group flex min-h-16 items-center gap-3 px-5 py-3.5 transition-colors duration-(--duration-fast) hover:bg-muted/60 active:bg-muted">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm text-muted-foreground">{t(`choose.${key}`)}</span>
                    <span className="font-semibold">{testName(id)}</span>
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) group-hover:translate-x-1 group-hover:text-foreground"
                  />
                </a>
              </li>
            ))}
          </ul>
          <div className="flex">{book("default")}</div>
        </div>
      </Section>

      <Section className="flex flex-col gap-10">
        <div className="grid gap-4 md:grid-cols-3">
          {practical.map(({ key, icon: Icon }, i) => (
            <div key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} className="flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <h2 className="font-heading text-lg font-bold font-stretch-expanded">{t(`${key}.title`)}</h2>
              {key === "prepare" ? (
                <>
                  <List items={restedAndFed[locale]} />
                  <p className="border-l-2 border-signal pl-3 text-sm font-medium">{t("tests.prep.fastedNote")}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t(`${key}.text`)}</p>
              )}
              {key === "after" && (
                <p className="mt-auto border-l-2 border-signal pl-3 text-sm font-medium">
                  {t("after.offer", { days: afterTestOffer.planFreeDays, percent: afterTestOffer.coachingFirstMonthDiscountPercent })}
                </p>
              )}
            </div>
          ))}
        </div>
        <PhotoSlot slot="labSample" className="max-w-3xl" />
        <div className="flex">{book()}</div>
      </Section>

      <Section className="flex flex-col gap-10 pt-0 md:pt-0">
        <SectionHeading title={t("faq.title")} />
        <Faq
          items={faq.map((key) => ({
            question: t(`faq.${key}.question`),
            answer: t(`faq.${key}.answer`, { min: Math.min(...minutes), max: Math.max(...minutes) }),
          }))}
        />
        <div className="flex">{book()}</div>
      </Section>

      <CtaBand
        title={`${home("offers.coaching.title")}, ${home("offers.coaching.price", { price: format.number(euros(Math.min(...packages.map((p) => p.priceCents)))) })}`}
        text={home("offers.coaching.text")}
        action={
          <Button asChild size="lg" variant="secondary">
            <Link href="/coaching">
              {home("offers.coaching.cta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
    </main>
  );
}
