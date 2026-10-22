import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { labTests, packages, sports } from "@jakamarinko/types";
import { LactateCurve } from "@/components/brand/lactate-curve";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { RaceBib } from "@/components/brand/race-bib";
import { SectionHeading } from "@/components/brand/section-heading";
import { SiteJsonLd } from "@/components/site/json-ld";
import { ProofBand } from "@/components/site/proof-band";
import { CtaBand, Section } from "@/components/site/section";
import { Steps } from "@/components/site/steps";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { bookingHref, euros, pageMetadata, photos } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return pageMetadata(locale, "", { title: t("title"), description: t("description") });
}

const steps = ["test", "zones", "plan", "progress"] as const;

export default function Home({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");
  const common = useTranslations("common");
  const about = useTranslations("about");
  const contact = useTranslations("contact");
  const site = useTranslations("site");
  const format = useFormatter();
  const price = (cents: number) => format.number(euros(cents), { maximumFractionDigits: 2 });
  const cheapestPackage = Math.min(...packages.map((p) => p.priceCents));
  const cheapestTest = Math.min(...labTests.map((l) => l.priceCents));

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
        <div className="flex flex-col gap-6 md:gap-7">
          <p className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase motion-safe:animate-rise">
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {t("offers.lab.title")} · {t("offers.coaching.title")}
          </p>
          <h1 className="font-heading text-[2.6rem] leading-[0.98] font-extrabold tracking-[-0.02em] font-stretch-expanded motion-safe:animate-nudge sm:text-6xl lg:text-[4.25rem]">
            {t("hero.title")}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground motion-safe:animate-rise motion-safe:[animation-delay:80ms] md:text-xl">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col gap-3 motion-safe:animate-rise motion-safe:[animation-delay:160ms] sm:flex-row">
            <Button asChild size="lg" data-cta="primary">
              <Link href="/booking">
                {t("hero.primaryCta")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" data-cta="secondary">
              <Link href="/coaching">{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground motion-safe:animate-rise motion-safe:[animation-delay:240ms]">
            <Check aria-hidden className="size-4 text-primary" />
            {t("hero.note", { price: price(cheapestTest) })}
          </p>
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

      <ProofBand
        action={
          <Button asChild variant="outline" size="lg" data-cta="secondary">
            <Link href="/about">
              {t("proof.cta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />

      <Section className="flex flex-col gap-12">
        <SectionHeading title={t("howItWorks.title")} />
        <Steps items={steps.map((step) => ({ title: t(`howItWorks.${step}.title`), text: t(`howItWorks.${step}.text`) }))} />
        <Button asChild size="lg" className="self-start" data-cta="secondary">
          <Link href={bookingHref("lactate-profile")}>
            {t("howItWorks.cta")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Section>

      <Section className="flex flex-col gap-12 pt-0 md:pt-0">
        <SectionHeading title={t("offers.title")} />
        <div className="grid gap-6 md:grid-cols-2">
          <article data-reveal-item className="lift flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-linear-to-b from-muted/40 to-card px-6 pt-8 pb-4 md:px-8">
              <LactateCurve />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
              <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("offers.lab.price", { price: price(cheapestTest) })}</p>
              <h3 className="font-heading text-2xl font-bold font-stretch-expanded md:text-3xl">{t("offers.lab.title")}</h3>
              <p className="text-muted-foreground">{t("offers.lab.text")}</p>
              <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row">
                <Button asChild data-cta="secondary">
                  <Link href="/booking">{common("actions.bookTest")}</Link>
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
              <ul aria-label={t("sports.title")} className="flex flex-wrap gap-1.5">
                {sports.map((sport) => (
                  <li key={sport} className="rounded-full border bg-secondary/60 px-3 py-1 text-xs text-secondary-foreground">
                    {common(`sports.${sport}`)}
                  </li>
                ))}
              </ul>
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

      <TestimonialsSection
        action={
          <Button asChild variant="outline" size="lg" data-cta="secondary">
            <Link href="/about">
              {t("proof.cta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />

      <CtaBand
        title={t("cta.title")}
        text={t("cta.text")}
        action={
          <>
            <Button asChild size="lg" variant="secondary" data-cta="secondary">
              <Link href="/booking">
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
