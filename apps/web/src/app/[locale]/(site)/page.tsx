import { offerRules } from "@jakamarinko/api";
import { ArrowRight, Check, Gauge, MessageSquareText, Waves } from "lucide-react";
import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { labTests, packages, separatePrice, sports } from "@jakamarinko/types";
import { HeroTitle } from "@/components/brand/hero-title";
import { LactateCurve } from "@/components/brand/lactate-curve";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { RaceBib } from "@/components/brand/race-bib";
import { SectionHeading } from "@/components/brand/section-heading";
import { Faq } from "@/components/site/faq";
import { Location } from "@/components/site/location";
import { SiteJsonLd } from "@/components/site/json-ld";
import { ProofBand } from "@/components/site/proof-band";
import { CtaBand, Section } from "@/components/site/section";
import { bookingHref, euros, pageMetadata, photos } from "@/components/site/site";
import { Steps } from "@/components/site/steps";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FoundingCounter } from "@/components/offers/founding-counter";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return pageMetadata(locale, "", { title: t("title"), description: t("description") });
}

const steps = ["test", "zones", "plan", "progress"] as const;
const gets = [
  { key: "thresholds", icon: Waves },
  { key: "zones", icon: Gauge },
  { key: "explained", icon: MessageSquareText },
] as const;
const faq = ["fit", "whatYouGet", "duration", "cancel"] as const;

export default function Home({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");
  const common = useTranslations("common");
  const about = useTranslations("about");
  const contact = useTranslations("contact");
  const landing = useTranslations("landing.faq");
  const curve = useTranslations("lab.curve");
  const site = useTranslations("site");
  const format = useFormatter();
  const price = (cents: number) => format.number(euros(cents), { maximumFractionDigits: 2 });
  const cheapestPackage = Math.min(...packages.map((p) => p.priceCents));
  const lactate = labTests.find((l) => l.id === "lactate-profile")!;
  const performance = labTests.find((l) => l.id === "performance")!;
  const performanceSeparate = separatePrice(performance)!.separateCents;

  // The page's one action, repeated at the end of every section: the lactate profile, the entry test.
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
      <SiteJsonLd
        locale={locale}
        description={t("meta.description")}
        jobTitle={about("intro")}
        contact={{
          phone: contact("phone.value"),
          email: contact("email.value"),
          instagram: contact("instagram.href"),
          strava: contact("strava.href"),
        }}
      />

      <Section
        reveal={false}
        className="grid items-center gap-12 pt-8 pb-16 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 lg:pt-20 lg:pb-24"
      >
        <div className="hero-screen flex flex-col gap-6 md:gap-7">
          <p className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase motion-safe:animate-rise">
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {t("offers.lab.title")} · {t("offers.coaching.title")}
          </p>
          <HeroTitle>{t("hero.title")}</HeroTitle>
          <p data-subline className="max-w-xl text-lg text-muted-foreground motion-safe:animate-rise motion-safe:[animation-delay:80ms] md:text-xl">
            {t("hero.subtitle", { price: price(lactate.priceCents) })}
          </p>
          <div className="flex flex-col gap-3 motion-safe:animate-rise motion-safe:[animation-delay:160ms] sm:flex-row">
            <Button asChild size="lg" data-cta="primary">
              <Link href={bookingHref("lactate-profile")}>
                {t("hero.primaryCta")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/lab">{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
          <p className="flex items-start gap-2 text-sm text-muted-foreground motion-safe:animate-rise motion-safe:[animation-delay:240ms]">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {t("hero.note", { price: price(lactate.priceCents) })}
          </p>
          <FoundingCounter percent={offerRules.foundingPercent} />
        </div>
        <PhotoFrame
          src={photos.redBull}
          alt={site("photos.redBull.alt")}
          caption={site("photos.redBull.caption")}
          position="55% 30%"
          hero
          depth
          strip
          sizes="(min-width: 1024px) 28rem, (min-width: 640px) 28rem, calc(100vw - 2.625rem)"
          className="mx-auto max-w-md lg:max-w-none"
          overlay={
            <RaceBib
              label={t("hero.bib")}
              value={t("proof.vo2max.value")}
              unit={common("units.vo2max")}
              className="absolute bottom-6 left-4 md:bottom-10 lg:-left-12"
            />
          }
        />
      </Section>

      <ProofBand action={bookLactate()}>
        <ul aria-label={t("sports.title")} className="flex flex-wrap gap-1.5">
          {sports.map((sport) => (
            <li key={sport} className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
              {common(`sports.${sport}`)}
            </li>
          ))}
        </ul>
      </ProofBand>

      <Section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <figure className="order-2 flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-md md:p-7 lg:order-1">
          <LactateCurve labels={{ x: curve("x"), y: curve("y") }} />
          <figcaption className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span aria-hidden className="h-px w-4 bg-signal" />
            {t("whatYouGet.caption")}
          </figcaption>
        </figure>
        <div className="order-1 flex flex-col gap-10 lg:order-2">
          <SectionHeading title={t("whatYouGet.title")} />
          <ul className="flex flex-col gap-6">
            {gets.map(({ key, icon: Icon }, i) => (
              <li key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div className="flex flex-col gap-1 pt-1">
                  <h3 className="font-heading text-lg font-bold font-stretch-expanded">{t(`whatYouGet.${key}.title`)}</h3>
                  <p className="text-muted-foreground">{t(`whatYouGet.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex">{bookLactate("default")}</div>
        </div>
      </Section>

      <Section tone="tinted" className="flex flex-col gap-12">
        <SectionHeading title={t("howItWorks.title")} />
        <Steps items={steps.map((step) => ({ title: t(`howItWorks.${step}.title`), text: t(`howItWorks.${step}.text`) }))} />
        <div className="flex">
          <Button asChild size="lg" variant="outline" data-cta="secondary">
            <Link href={bookingHref("lactate-profile")}>
              {t("howItWorks.cta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      <Section className="flex flex-col gap-12">
        <SectionHeading title={t("offers.title")} />
        <div className="grid gap-6 md:grid-cols-2">
          <article data-reveal-item className="lift flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
            <PhotoFrame
              src={photos.finish}
              alt={site("photos.finish.alt")}
              aspect="wide"
              treatment="tinted"
              position="70% 35%"
              sizes="(min-width: 768px) 34rem, calc(100vw - 2rem)"
              flush
            />
            <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
              <h3 className="font-heading text-2xl font-bold font-stretch-expanded md:text-3xl">{t("offers.lab.title")}</h3>
              <ul className="flex flex-col gap-3">
                <li className="flex flex-col gap-0.5 rounded-xl bg-primary/8 px-4 py-3">
                  <span className="font-semibold">{t("offers.lab.featured", { price: price(lactate.priceCents) })}</span>
                </li>
                <li className="flex flex-col gap-0.5 rounded-xl border px-4 py-3 text-sm">
                  {t("offers.lab.performance", { price: price(performance.priceCents), separate: price(performanceSeparate) })}
                </li>
              </ul>
              <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row">
                <Button asChild data-cta="secondary">
                  <Link href={bookingHref("lactate-profile")}>{t("hero.primaryCta")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/lab">{t("offers.lab.cta")}</Link>
                </Button>
              </div>
            </div>
          </article>
          <article data-reveal-item style={{ "--i": 1 } as React.CSSProperties} className="lift flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
            <PhotoFrame
              src={photos.xcSki}
              alt={site("photos.xcSki.alt")}
              aspect="wide"
              treatment="tinted"
              position="35% 30%"
              sizes="(min-width: 768px) 34rem, calc(100vw - 2rem)"
              flush
            />
            <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
              <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("offers.coaching.price", { price: price(cheapestPackage) })}</p>
              <h3 className="font-heading text-2xl font-bold font-stretch-expanded md:text-3xl">{t("offers.coaching.title")}</h3>
              <p className="text-muted-foreground">{t("offers.coaching.text")}</p>
              <div className="mt-auto pt-4">
                <Button asChild variant="outline" className="w-full sm:w-auto" data-cta="secondary">
                  <Link href="/coaching">
                    {t("offers.coaching.cta")}
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </div>
      </Section>

      <TestimonialsSection action={bookLactate()} />

      <Section className="grid gap-10 pt-0 md:pt-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
        <div className="flex flex-col gap-10">
          <SectionHeading title={t("faq.title")} />
          <Faq items={faq.map((key) => ({ question: landing(`${key}.question`), answer: landing(`${key}.answer`) }))} />
          <div className="flex">{bookLactate()}</div>
        </div>
        <Location className="self-start lg:mt-20" />
      </Section>

      <CtaBand
        title={t("cta.title")}
        text={t("cta.text")}
        action={
          <>
            <Button asChild size="lg" variant="secondary" data-cta="secondary">
              <Link href={bookingHref("lactate-profile")}>
                {t("cta.button")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/contact">{t("cta.secondary")}</Link>
            </Button>
          </>
        }
      />
    </main>
  );
}
