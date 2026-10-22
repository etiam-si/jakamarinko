import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { labTests, packages, sports } from "@jakamarinko/types";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatBlock } from "@/components/brand/stat-block";
import { SiteJsonLd } from "@/components/site/json-ld";
import { CtaBand, Section } from "@/components/site/section";
import { bookingHref, euros, pageMetadata, photos } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return pageMetadata(locale, "", { title: t("title"), description: t("description") });
}

const proof = ["vo2max", "redBull", "nationalTeam", "champion"] as const;
const steps = ["test", "zones", "plan", "progress"] as const;
// Cool to hot, like the zones the steps lead to.
const stepColours = ["bg-zone-1", "bg-zone-2", "bg-zone-4", "bg-zone-5"];

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

      <Section className="grid items-center gap-10 pt-10 md:grid-cols-[1fr_auto] md:pt-16">
        <div className="flex flex-col gap-6">
          <h1 className="font-heading text-4xl leading-[1.05] font-extrabold tracking-tight text-balance font-stretch-expanded sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground md:text-xl">{t("hero.subtitle")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/booking">
                {t("hero.primaryCta")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/coaching">{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check aria-hidden className="size-4 text-primary" />
            {t("hero.note", { price: price(cheapestTest) })}
          </p>
        </div>
        <PhotoFrame
          src={photos.redBull}
          alt={site("photos.redBull.alt")}
          caption={site("photos.redBull.caption")}
          position="55% 30%"
          eager
          sizes="(min-width: 1024px) 24rem, (min-width: 768px) 20rem, (min-width: 640px) 18rem, 16rem"
          className="mx-auto w-64 sm:w-72 md:w-80 lg:w-96"
        />
      </Section>

      <Section tinted className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded md:text-3xl">{t("proof.title")}</h2>
          <p className="text-muted-foreground">{t("proof.text")}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {proof.map((key) => (
            <StatBlock key={key} value={t(`proof.${key}.value`)} label={t(`proof.${key}.label`)} />
          ))}
        </div>
        <Button asChild variant="outline" className="self-start">
          <Link href="/about">
            {t("proof.cta")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Section>

      <Section className="flex flex-col gap-10">
        <SectionHeading title={t("howItWorks.title")} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
              <span aria-hidden className={`h-1.5 rounded-full ${stepColours[i]}`} />
              <span aria-hidden className="font-mono text-xs text-muted-foreground tabular-nums">
                0{i + 1}
              </span>
              <h3 className="font-heading text-lg font-bold font-stretch-expanded">{t(`howItWorks.${step}.title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`howItWorks.${step}.text`)}</p>
            </li>
          ))}
        </ol>
        <Button asChild size="lg" className="self-start">
          <Link href={bookingHref("lactate-profile")}>
            {t("howItWorks.cta")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Section>

      <Section className="flex flex-col gap-10">
        <SectionHeading title={t("offers.title")} />
        <div className="grid gap-6 md:grid-cols-2">
          <article className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm md:p-8">
            <h3 className="font-heading text-2xl font-bold font-stretch-expanded">{t("offers.lab.title")}</h3>
            <p className="font-heading text-xl font-bold tabular-nums">{t("offers.lab.price", { price: price(cheapestTest) })}</p>
            <p className="text-muted-foreground">{t("offers.lab.text")}</p>
            <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row">
              <Button asChild>
                <Link href="/booking">{common("actions.bookTest")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/lab">{t("offers.lab.cta")}</Link>
              </Button>
            </div>
          </article>
          <article className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm md:p-8">
            <h3 className="font-heading text-2xl font-bold font-stretch-expanded">{t("offers.coaching.title")}</h3>
            <p className="font-heading text-xl font-bold tabular-nums">{t("offers.coaching.price", { price: price(cheapestPackage) })}</p>
            <p className="text-muted-foreground">{t("offers.coaching.text")}</p>
            <div className="flex flex-col gap-2">
              <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("sports.title")}</h4>
              <ul className="flex flex-wrap gap-1.5">
                {sports.map((sport) => (
                  <li key={sport} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                    {common(`sports.${sport}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/coaching">{t("offers.coaching.cta")}</Link>
              </Button>
            </div>
          </article>
        </div>
      </Section>

      <CtaBand
        title={t("cta.title")}
        text={t("cta.text")}
        action={
          <>
            <Button asChild size="lg" variant="secondary">
              <Link href="/booking">{t("cta.button")}</Link>
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
