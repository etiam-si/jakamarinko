import { offerRules } from "@jakamarinko/api";
import type { LabTestId, Locale } from "@jakamarinko/types";
import { afterTestOffer, labTests, restedAndFed } from "@jakamarinko/types";
import { ArrowRight, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { LactateCurve } from "@/components/brand/lactate-curve";
import { SectionHeading } from "@/components/brand/section-heading";
import { Faq } from "@/components/site/faq";
import { Location } from "@/components/site/location";
import { PhotoSlot } from "@/components/site/photo-slot";
import { ProofBand } from "@/components/site/proof-band";
import { FoundingCounter } from "@/components/offers/founding-counter";
import { CtaBand, Section } from "@/components/site/section";
import { bookingHref, euros, pageMetadata } from "@/components/site/site";
import { Steps } from "@/components/site/steps";
import { List, TestCard, TestList } from "@/components/site/test-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lab.meta" });
  return pageMetadata(locale, "/lab", { title: t("title"), description: t("description") });
}

const what = ["s1", "s2", "s3"] as const;
// Which need points to which test.
const choose: [key: string, test: LabTestId][] = [
  ["lactate", "lactate-profile"],
  ["vo2max", "vo2max"],
  ["combined", "vo2max-lactate"],
  ["fatCarb", "fat-carb"],
  ["economy", "running-economy"],
  ["performance", "performance"],
];
// The price list in the order of the conversion playbook (§5.1): the hero bundle first as the anchor, the two
// named bundles, the middle option, the entry test, then the singles. Retest offers come last, for returning athletes.
const order: { id: LabTestId; badge?: "forLongRaces" | "forRunners" | "bestFirst" }[] = [
  { id: "lactate-profile", badge: "bestFirst" },
  { id: "long-distance", badge: "forLongRaces" },
  { id: "runner", badge: "forRunners" },
  { id: "vo2max-lactate" },
];
// The single tests as a compact list under the cards, and the offers for athletes who come back.
const singles: LabTestId[] = ["vo2max", "fat-carb", "running-economy", "anthropometry"];
const comeBack: LabTestId[] = ["season", "lactate-retest"];
const practical = [
  { key: "prepare", icon: ClipboardList },
  { key: "after", icon: Sparkles },
] as const;
const faq = ["fit", "blood", "duration", "whatYouGet", "preparation", "cancel", "where", "retest", "noCoach"] as const;

export default function Lab({ params }: Props) {
  const locale = use(params).locale as Locale;
  setRequestLocale(locale);
  const t = useTranslations("lab");
  const common = useTranslations("common");
  const landing = useTranslations("landing.faq");
  const home = useTranslations("home");
  const site = useTranslations("site");
  const format = useFormatter();
  const test = (id: LabTestId) => labTests.find((item) => item.id === id)!;
  const lactatePrice = format.number(euros(test("lactate-profile").priceCents), { maximumFractionDigits: 2 });

  // The entry test, as the page's main action: in the hero, after "what happens" and in the close (three, not seven).
  const bookLactate = (variant: "default" | "outline" = "outline") => (
    <Button asChild size="lg" variant={variant} data-cta="secondary">
      <Link href={bookingHref("lactate-profile")}>
        {t("hero.primaryCta")}
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
          <SectionHeading as="h1" eyebrow={common("nav.lab")} title={t("hero.title")} lead={t("hero.subtitle", { price: lactatePrice })} />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" data-cta="primary">
                <Link href={bookingHref("lactate-profile")}>
                  {t("hero.primaryCta")}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#choose">{t("hero.secondaryCta")}</a>
              </Button>
            </div>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              {t("hero.trust")} · {site("location.trust")}
            </p>
            <FoundingCounter percent={offerRules.foundingPercent} />
          </div>
        </div>
        <PhotoSlot
          slot="labHero"
          className="mx-auto max-w-md lg:max-w-none"
          fallback={
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div
                aria-hidden
                className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-2xl bg-linear-to-br from-primary to-primary-deep md:translate-x-4 md:translate-y-4"
              />
              <div className="relative mr-2.5 rounded-2xl border bg-card p-5 shadow-xl md:mr-4 md:p-7">
                <p className="mb-5 flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  <span aria-hidden className="size-1.5 rounded-full bg-signal" />
                  {test("lactate-profile").name[locale]}
                </p>
                <LactateCurve labels={{ x: t("curve.x"), y: t("curve.y") }} />
              </div>
            </div>
          }
        />
      </Section>

      <ProofBand
        compact
        action={
          <Button asChild variant="outline" size="lg" data-cta="secondary">
            <a href="#tests">
              {t("tests.title")}
              <ArrowRight aria-hidden />
            </a>
          </Button>
        }
      >
        <p className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-signal" />
          {t("proof.by")}
        </p>
      </ProofBand>

      <Section id="choose" className="flex scroll-mt-20 flex-col gap-10">
        <SectionHeading title={t("choose.title")} />
        <ul className="grid gap-3 md:grid-cols-2">
          {choose.map(([key, id], i) => (
            <li key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties}>
              <a
                href={`#${id}`}
                data-cta="secondary"
                className="group lift flex min-h-16 items-center gap-4 rounded-2xl border bg-card px-4 py-3 shadow-sm hover:border-primary/40 md:px-5"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm text-muted-foreground">{t(`choose.${key}`)}</span>
                  <span className="font-semibold">{test(id).name[locale]}</span>
                </span>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-(--duration-base) group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight aria-hidden className="size-4" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tests" tone="tinted" className="flex scroll-mt-20 flex-col gap-10">
        <SectionHeading title={t("tests.title")} lead={common("units.vatIncluded")} />
        <TestCard test={test("performance")} locale={locale} featured badge={t("tests.bestValue")} />
        <div className="grid gap-6 lg:grid-cols-2">
          {order.map(({ id, badge }) => (
            <TestCard key={id} test={test(id)} locale={locale} badge={badge && t(`tests.${badge}`)} />
          ))}
        </div>
        <TestList tests={singles.map(test)} locale={locale} />
        <div className="flex flex-col gap-6 pt-4">
          <SectionHeading as="h3" title={t("tests.comeBack.title")} lead={t("tests.comeBack.lead")} />
          <TestList tests={comeBack.map(test)} locale={locale} />
        </div>
      </Section>

      <Section className="flex flex-col gap-10">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <SectionHeading title={t("what.title")} />
            <Steps vertical items={what.map((key) => ({ text: t(`what.${key}`) }))} />
            <p className="border-l-2 border-signal pl-4 font-medium">{t("what.hard")}</p>
          </div>
          <PhotoSlot slot="labSample" className="self-start" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {practical.map(({ key, icon: Icon }, i) => (
            <div key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
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
          <Location data-reveal-item />
        </div>
        <div className="flex">{bookLactate("default")}</div>
      </Section>

      <Section className="flex flex-col gap-10 pt-0 md:pt-0">
        <SectionHeading title={t("faq.title")} />
        <Faq items={faq.map((key) => ({ question: landing(`${key}.question`), answer: landing(`${key}.answer`) }))} />
        <div className="flex">
          <Button asChild variant="outline" size="lg" data-cta="secondary">
            <Link href="/contact">
              {home("cta.secondary")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      <CtaBand
        title={t("close.title")}
        text={t("close.text")}
        action={
          <Button asChild size="lg" variant="secondary" data-cta="secondary">
            <Link href={bookingHref("lactate-profile")}>
              {t("close.button")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
    </main>
  );
}
