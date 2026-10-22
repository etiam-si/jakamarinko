import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { packages, sports } from "@jakamarinko/types";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatBlock } from "@/components/brand/stat-block";
import { SiteJsonLd } from "@/components/site/json-ld";
import { CtaBand, Section } from "@/components/site/section";
import { euros, pageMetadata, photos } from "@/components/site/site";
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
  const cheapest = Math.min(...packages.map((p) => p.priceCents));

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
          <p className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {t("hero.subtitle")}
          </p>
          <h1 className="font-heading text-4xl leading-[1.05] font-extrabold tracking-tight text-balance font-stretch-expanded sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">{t("intro")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-5 text-base">
              <Link href="/lab">{t("hero.primaryCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5 text-base">
              <Link href="/coaching">{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
        </div>
        <PhotoFrame
          src={photos.redBull}
          alt={site("photos.redBull.alt")}
          caption={site("photos.redBull.caption")}
          position="55% 30%"
          className="mx-auto md:w-80 lg:w-96"
        />
      </Section>

      <Section className="border-y border-border">
        <h2 className="mb-10 font-heading text-2xl font-bold tracking-tight font-stretch-expanded md:text-3xl">
          {t("proof.title")}
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {proof.map((key) => (
            <StatBlock key={key} value={t(`proof.${key}.value`)} label={t(`proof.${key}.label`)} />
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="mb-10 font-heading text-3xl font-bold tracking-tight font-stretch-expanded md:text-4xl">
          {t("howItWorks.title")}
        </h2>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step} className="flex flex-col gap-3">
              <span aria-hidden className="font-mono text-sm text-muted-foreground tabular-nums">
                0{i + 1}
              </span>
              <span aria-hidden className={`h-1.5 rounded-full ${stepColours[i]}`} />
              <h3 className="font-heading text-xl font-bold font-stretch-expanded">{t(`howItWorks.${step}.title`)}</h3>
              <p className="text-muted-foreground">{t(`howItWorks.${step}.text`)}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="flex flex-col gap-10">
        <SectionHeading title={t("offers.title")} />
        <div className="grid gap-6 md:grid-cols-2">
          {(["lab", "coaching"] as const).map((offer) => (
            <article key={offer} className="flex flex-col gap-4 rounded-lg bg-card p-6 ring-1 ring-border md:p-8">
              <h3 className="font-heading text-2xl font-bold font-stretch-expanded">{t(`offers.${offer}.title`)}</h3>
              <p className="text-muted-foreground">
                {t(`offers.${offer}.text`, { price: format.number(euros(cheapest), { maximumFractionDigits: 2 }) })}
              </p>
              <Button asChild variant="secondary" size="lg" className="mt-auto self-start px-4">
                <Link href={offer === "lab" ? "/lab" : "/coaching"}>{t(`offers.${offer}.cta`)}</Link>
              </Button>
            </article>
          ))}
        </div>
      </Section>

      <Section className="flex flex-col gap-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded">
          {t("sports.title")}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {sports.map((sport) => (
            <li key={sport} className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              {common(`sports.${sport}`)}
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        title={t("cta.title")}
        text={t("cta.text")}
        action={
          <Button asChild size="lg" variant="secondary" className="h-11 shrink-0 px-5 text-base">
            <Link href="/lab">{t("cta.button")}</Link>
          </Button>
        }
      />
    </main>
  );
}
