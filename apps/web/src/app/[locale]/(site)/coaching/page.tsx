import type { Locale } from "@jakamarinko/types";
import { afterTestOffer, oneOffs, packages, sessions } from "@jakamarinko/types";
import { ArrowRight, Brain, CalendarSync, Flag, Footprints, HeartPulse, TrendingUp, UserRound, Watch } from "lucide-react";
import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { PriceCard } from "@/components/brand/price-card";
import { SectionHeading } from "@/components/brand/section-heading";
import { Faq } from "@/components/site/faq";
import { CtaBand, Section } from "@/components/site/section";
import { bookingHref, eurFormat, euros, pageMetadata, photos } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coaching.meta" });
  return pageMetadata(locale, "/coaching", { title: t("title"), description: t("description") });
}

const services = [
  { key: "individual", icon: UserRound },
  { key: "online", icon: CalendarSync },
  { key: "racePrep", icon: Flag },
  { key: "watchData", icon: Watch },
  { key: "progressReview", icon: TrendingUp },
  { key: "mental", icon: Brain },
  { key: "biomechanics", icon: Footprints },
  { key: "physiology", icon: HeartPulse },
] as const;
const faq = ["labTestFirst", "devices", "minimumTerm", "yearly", "messages"] as const;

export default function Coaching({ params }: Props) {
  const locale = use(params).locale as Locale;
  setRequestLocale(locale);
  const t = useTranslations("coaching");
  const p = useTranslations("packages");
  const common = useTranslations("common");
  const site = useTranslations("site");
  const format = useFormatter();
  const eur = (cents: number) => format.number(euros(cents), eurFormat);
  const session = sessions[0]!;

  return (
    <main>
      <Section className="grid items-center gap-10 pt-10 md:grid-cols-[1fr_auto] md:pt-16">
        <div className="flex flex-col gap-8">
          <SectionHeading as="h1" eyebrow={common("nav.coaching")} title={t("hero.title")} lead={t("hero.subtitle")} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="#packages">
                {t("hero.primaryCta")}
                <ArrowRight aria-hidden />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/lab">{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
        </div>
        <PhotoFrame
          src={photos.xcSki}
          alt={site("photos.xcSki.alt")}
          caption={site("photos.xcSki.caption")}
          aspect="square"
          position="35% 35%"
          className="mx-auto w-56 sm:w-64 md:w-72 lg:w-80"
        />
      </Section>

      <Section tinted className="flex flex-col gap-10">
        <SectionHeading title={t("services.title")} />
        <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {services.map(({ key, icon: Icon }) => (
            <li key={key} className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm md:p-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden className="size-4" />
              </span>
              <h3 className="font-semibold leading-snug">{t(`services.${key}.title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`services.${key}.text`)}</p>
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" className="self-start">
          <a href="#packages">
            {t("services.cta")}
            <ArrowRight aria-hidden />
          </a>
        </Button>
      </Section>

      <Section id="packages" className="flex scroll-mt-20 flex-col gap-10">
        <SectionHeading title={t("packages.title")} lead={p("subtitle")} />
        <div className="grid gap-6 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PriceCard
              key={pkg.id}
              name={pkg.name[locale]}
              price={eur(pkg.priceCents)}
              period={site("perMonth")}
              description={pkg.audience[locale]}
              features={pkg.features[locale]}
              badge={pkg.featured ? p("featured") : undefined}
              featured={pkg.featured}
              action={
                <div className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <li>{pkg.minimumMonths > 1 ? p("minimumTerm", { count: pkg.minimumMonths }) : p("noMinimumTerm")}</li>
                    <li>{p("yearly", { price: format.number(euros(pkg.yearlyPriceCents)) })}</li>
                  </ul>
                  <Button asChild size="lg" variant={pkg.featured ? "default" : "outline"} className="w-full">
                    <Link href={{ pathname: "/contact", query: { package: pkg.id } }}>{p("choose", { name: pkg.name[locale] })}</Link>
                  </Button>
                </div>
              }
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{common("units.vatIncluded")}</p>
        <aside className="flex flex-col gap-1 rounded-xl border border-l-4 border-l-signal bg-card p-5 shadow-sm">
          <h3 className="font-heading font-bold font-stretch-expanded">{p("afterTest.title")}</h3>
          <p className="text-muted-foreground">
            {p("afterTest.text", { days: afterTestOffer.planFreeDays, percent: afterTestOffer.coachingFirstMonthDiscountPercent })}
          </p>
        </aside>
      </Section>

      <Section className="flex flex-col gap-10">
        <SectionHeading title={p("oneOff.title")} lead={p("oneOff.subtitle")} />
        <div className="grid gap-6 md:grid-cols-3">
          <PriceCard
            name={session.name[locale]}
            price={eur(session.priceCents)}
            description={session.description[locale]}
            action={
              <Button asChild size="lg" variant="outline" className="h-auto min-h-12 w-full py-2.5 whitespace-normal">
                <Link href={bookingHref(session.id)}>{common("actions.bookItem", { name: session.name[locale] })}</Link>
              </Button>
            }
          />
          {oneOffs.map((item) => (
            <PriceCard
              key={item.id}
              name={item.name[locale]}
              price={eur(item.priceCents)}
              description={item.description[locale]}
              action={
                <Button asChild size="lg" variant="outline" className="h-auto min-h-12 w-full py-2.5 whitespace-normal">
                  <Link href={{ pathname: "/contact", query: { package: item.id } }}>
                    {p("choose", { name: item.name[locale] })}
                  </Link>
                </Button>
              }
            />
          ))}
        </div>
      </Section>

      <Section className="flex flex-col gap-8">
        <SectionHeading title={t("faq.title")} />
        <Faq items={faq.map((key) => ({ question: t(`faq.${key}.question`), answer: t(`faq.${key}.answer`) }))} />
      </Section>

      <CtaBand
        title={t("cta.title")}
        text={t("cta.text")}
        action={
          <Button asChild size="lg" variant="secondary">
            <Link href="/contact">{t("cta.button")}</Link>
          </Button>
        }
      />
    </main>
  );
}
