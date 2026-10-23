import type { Locale } from "@jakamarinko/types";
import { afterTestOffer, labTests, oneOffs, packages, sessions } from "@jakamarinko/types";
import { ArrowRight, Brain, CalendarSync, Flag, Footprints, HeartPulse, MessageCircle, TrendingUp, UserRound, Watch } from "lucide-react";
import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { PriceCard } from "@/components/brand/price-card";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatBlock } from "@/components/brand/stat-block";
import { ClimbChart } from "@/components/site/climb-chart";
import { climbsFrom, toSeconds } from "@/components/site/climbs";
import { Faq } from "@/components/site/faq";
import { PhotoSlot } from "@/components/site/photo-slot";
import { CtaBand, Section } from "@/components/site/section";
import { bookingHref, euro, euros, pageMetadata, photos } from "@/components/site/site";
import { Steps } from "@/components/site/steps";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coaching.meta" });
  return pageMetadata(locale, "/coaching", { title: t("title"), description: t("description") });
}

// What coaching covers, as one line of chips under the packages (was a wall of eight cards).
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
const steps = ["test", "plan", "analysis", "retest"] as const;
const roles = ["plan", "coach", "messages"] as const;
const faq = ["whoWrites", "coachingFit", "coachingTime", "labTestFirst", "devices", "minimumTerm", "yearly", "messages"] as const;

export default function Coaching({ params }: Props) {
  const locale = use(params).locale as Locale;
  setRequestLocale(locale);
  const t = useTranslations("coaching");
  const p = useTranslations("packages");
  const about = useTranslations("about.smarnaGora");
  const proof = useTranslations("home.proof");
  const common = useTranslations("common");
  const site = useTranslations("site");
  const home = useTranslations("home");
  const format = useFormatter();
  const plain = (cents: number) => format.number(euros(cents), { maximumFractionDigits: 2 });
  const session = sessions[0]!;
  const lactate = labTests.find((test) => test.id === "lactate-profile")!;
  const climbs = climbsFrom(about.raw("times") as Record<string, string>);
  const goal = { age: Number(about("goalAge")), seconds: toSeconds(about("goalTime")) };

  // The page's action: a lead, because packages can't be bought online yet (playbook §4.3).
  const tellGoal = (variant: "default" | "outline" | "secondary" = "outline", primary = false) => (
    <Button asChild size="lg" variant={variant} data-cta={primary ? "primary" : "secondary"}>
      <Link href={{ pathname: "/contact", query: { package: "coaching" } }}>
        {t("hero.primaryCta")}
        <ArrowRight aria-hidden />
      </Link>
    </Button>
  );

  return (
    <main>
      <Section
        reveal={false}
        className="grid items-center gap-12 pt-8 pb-16 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16 lg:pt-20 lg:pb-24"
      >
        <div className="hero-screen flex flex-col gap-8">
          <SectionHeading as="h1" eyebrow={common("nav.coaching")} title={t("hero.title")} lead={t("hero.subtitle")} />
          <div className="flex flex-col gap-3 sm:flex-row">
            {tellGoal("default", true)}
            <Button asChild size="lg" variant="outline">
              <Link href={bookingHref("lactate-profile")}>{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
        </div>
        <PhotoSlot
          slot="coachingHero"
          className="mx-auto max-w-sm lg:max-w-none"
          fallback={
            <PhotoFrame
              src={photos.xcSki}
              alt={site("photos.xcSki.alt")}
              caption={site("photos.xcSki.caption")}
              position="35% 35%"
              hero
              depth
              strip
              sizes="(min-width: 1024px) 24rem, (min-width: 640px) 24rem, calc(100vw - 2.625rem)"
              className="mx-auto max-w-[22.5rem] lg:max-w-none"
            />
          }
        />
      </Section>

      <Section tone="dark" data-proof className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-16">
        <div className="flex flex-col gap-10">
          <SectionHeading title={about("title")} lead={about("subtitle")} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10">
            {(["vo2max", "nationalTeam"] as const).map((key, i) => (
              <StatBlock key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} value={proof(`${key}.value`)} label={proof(`${key}.label`)} />
            ))}
          </div>
          <div className="flex">
            <Button asChild size="lg" variant="outline" data-cta="secondary">
              <a href="#packages">
                {common("actions.seePackages")}
                <ArrowRight aria-hidden />
              </a>
            </Button>
          </div>
        </div>
        <figure className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-lg md:p-6">
          <figcaption className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{about("timeAxis")}</figcaption>
          <ClimbChart climbs={climbs} goal={goal} ageLabel={(age) => about("age", { age })} />
          <p className="text-sm text-muted-foreground">{about("goal", { age: about("goalAge"), time: about("goalTime") })}</p>
        </figure>
      </Section>

      <Section id="packages" className="flex scroll-mt-20 flex-col gap-10">
        <SectionHeading title={t("packages.title")} lead={p("subtitle")} />
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PriceCard
              key={pkg.id}
              name={pkg.name[locale]}
              price={euro(format, pkg.priceCents)}
              period={site("perMonth")}
              description={pkg.audience[locale]}
              features={pkg.features[locale]}
              badge={pkg.featured ? p("featured") : undefined}
              featured={pkg.featured}
              action={
                <div className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {pkg.id === "coaching" && <li className="font-medium text-foreground">{t("packages.includedTest", { price: plain(lactate.priceCents) })}</li>}
                    <li>{pkg.minimumMonths > 1 ? p("minimumTerm", { count: pkg.minimumMonths }) : p("noMinimumTerm")}</li>
                    <li>{p("yearly", { price: plain(pkg.yearlyPriceCents) })}</li>
                  </ul>
                  <Button asChild size="lg" variant={pkg.featured ? "default" : "outline"} className="w-full" data-cta="secondary">
                    <Link href={{ pathname: "/contact", query: { package: pkg.id } }}>{p("ask", { name: pkg.name[locale] })}</Link>
                  </Button>
                </div>
              }
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{common("units.vatIncluded")}</p>
        <div className="flex flex-col gap-4">
          <h3 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("services.title")}</h3>
          <ul className="flex flex-wrap gap-2">
            {services.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-sm shadow-xs">
                <Icon aria-hidden className="size-4 text-primary" />
                {t(`services.${key}.title`)}
              </li>
            ))}
          </ul>
        </div>
        <aside className="flex flex-col gap-1 rounded-2xl border border-l-4 border-l-signal bg-card p-5 shadow-sm">
          <h3 className="font-heading font-bold font-stretch-expanded">{p("afterTest.title")}</h3>
          <p className="text-muted-foreground">
            {p("afterTest.text", { days: afterTestOffer.planFreeDays, percent: afterTestOffer.coachingFirstMonthDiscountPercent })}
          </p>
        </aside>
      </Section>

      <TestimonialsSection action={tellGoal()} realOnly />

      <Section tone="tinted" className="flex flex-col gap-12">
        <SectionHeading title={t("howItWorks.title")} />
        <Steps items={steps.map((step) => ({ title: t(`howItWorks.${step}.title`), text: t(`howItWorks.${step}.text`) }))} />
        <div className="flex flex-col gap-4">
          <h3 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("whoDoesWhat.title")}</h3>
          <ul className="grid gap-3 md:grid-cols-3">
            {roles.map((key, i) => (
              <li key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-xs">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {key === "messages" ? <MessageCircle aria-hidden className="size-4" /> : key === "coach" ? <UserRound aria-hidden className="size-4" /> : <CalendarSync aria-hidden className="size-4" />}
                </span>
                <p className="pt-1.5 text-sm">{t(`whoDoesWhat.${key}`)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex">
          <Button asChild size="lg" variant="outline" data-cta="secondary">
            <Link href={bookingHref("lactate-profile")}>
              {t("hero.secondaryCta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      <Section className="flex flex-col gap-10">
        <SectionHeading title={p("oneOff.title")} lead={p("oneOff.subtitle")} />
        {/* One list, not three big cards: these are the side offers next to the packages. */}
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border bg-card shadow-sm">
          {[
            { id: session.id, name: session.name[locale], priceCents: session.priceCents, description: session.description[locale], book: true },
            ...oneOffs.map((item) => ({ id: item.id, name: item.name[locale], priceCents: item.priceCents, description: item.description[locale], book: false })),
          ].map((item) => (
            <li key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6 md:p-5">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-heading text-base font-bold font-stretch-expanded md:text-lg">{item.name}</h3>
                  <p className="shrink-0 font-heading text-2xl leading-none font-extrabold tracking-tight tabular-nums font-stretch-expanded md:hidden">
                    {euro(format, item.priceCents)}
                  </p>
                </div>
                <p className="text-sm text-pretty text-muted-foreground">{item.description}</p>
              </div>
              <p className="hidden shrink-0 font-heading text-2xl leading-none font-extrabold tracking-tight tabular-nums font-stretch-expanded md:block">
                {euro(format, item.priceCents)}
              </p>
              <Button asChild variant="outline" className="h-auto min-h-11 w-full shrink-0 py-2 whitespace-normal md:w-48" data-cta="secondary">
                {item.book ? (
                  <Link href={bookingHref(session.id)}>{common("actions.bookItem", { name: item.name })}</Link>
                ) : (
                  <Link href={{ pathname: "/contact", query: { package: item.id } }}>{p("oneOff.cta")}</Link>
                )}
              </Button>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="flex flex-col gap-10 pt-0 md:pt-0">
        <SectionHeading title={t("faq.title")} />
        <Faq items={faq.map((key) => ({ question: t(`faq.${key}.question`), answer: t(`faq.${key}.answer`) }))} />
        <div className="flex">
          <Button asChild size="lg" variant="outline" data-cta="secondary">
            <Link href={{ pathname: "/contact", query: { package: "coaching" } }}>
              {home("cta.secondary")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      <CtaBand
        title={t("cta.title")}
        text={t("cta.text")}
        action={
          <Button asChild size="lg" variant="secondary" data-cta="secondary">
            <Link href={{ pathname: "/contact", query: { package: "coaching" } }}>
              {t("cta.button")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
    </main>
  );
}
