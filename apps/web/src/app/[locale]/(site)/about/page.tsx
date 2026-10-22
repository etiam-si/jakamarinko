import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { sports } from "@jakamarinko/types";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { SectionHeading } from "@/components/brand/section-heading";
import { climbsFrom, toSeconds } from "@/components/site/climbs";
import { CtaBand, Section } from "@/components/site/section";
import { pageMetadata, photos } from "@/components/site/site";
import { SmarnaGoraChart } from "@/components/site/smarna-gora-chart";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });
  return pageMetadata(locale, "/about", { title: t("title"), description: t("description") });
}

const bio = ["p1", "p2"] as const;
const achievements = ["champion", "nationalTeam", "worldXc", "europeanMountain", "worldMountain", "worldSkimo", "vo2max", "redBull"] as const;
const gallery = [
  { key: "skimo", position: "50% 30%" },
  { key: "xcSki", position: "30% 30%" },
  { key: "finish", position: "75% 35%" },
] as const;

export default function About({ params }: Props) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("about");
  const home = useTranslations("home");
  const common = useTranslations("common");
  const site = useTranslations("site");

  const climbs = climbsFrom(t.raw("smarnaGora.times") as Record<string, string>);
  const goal = { age: Number(t("smarnaGora.goalAge")), seconds: toSeconds(t("smarnaGora.goalTime")) };
  const goalLabel = t("smarnaGora.goal", { age: t("smarnaGora.goalAge"), time: t("smarnaGora.goalTime") });
  // Shown once Jaka's qualifications are known; until then the message is a TODO placeholder.
  const qualifications = t("qualifications.text");

  return (
    <main>
      <Section className="grid items-start gap-10 pt-10 md:grid-cols-[1fr_auto] md:pt-16">
        <div className="flex flex-col gap-8">
          <SectionHeading as="h1" eyebrow={common("brand.name")} title={t("title")} lead={t("intro")} />
          <div className="flex max-w-prose flex-col gap-4 text-pretty">
            {bio.map((p) => (
              <p key={p}>{t(`bio.${p}`)}</p>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/booking">
                {common("actions.bookTest")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/coaching">{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
        </div>
        <PhotoFrame
          src={photos.trail}
          alt={site("photos.trail.alt")}
          caption={site("photos.trail.caption")}
          position="62% 75%"
          className="mx-auto w-64 sm:w-72 md:w-80 lg:w-96"
        />
      </Section>

      <Section tinted className="grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded md:text-3xl">{t("achievements.title")}</h2>
          <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
            {achievements.map((key) => (
              <li key={key} className="flex gap-3 px-4 py-3 text-sm">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                {t(`achievements.${key}`)}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded md:text-3xl">{t("disciplines.title")}</h2>
          <ul className="flex flex-wrap gap-2">
            {sports.map((sport) => (
              <li key={sport} className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
                {common(`sports.${sport}`)}
              </li>
            ))}
          </ul>
          {!qualifications.startsWith("TODO") && (
            <>
              <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded md:text-3xl">{t("qualifications.title")}</h2>
              <p>{qualifications}</p>
            </>
          )}
        </div>
      </Section>

      <Section className="flex flex-col gap-8">
        <SectionHeading title={t("smarnaGora.title")} lead={t("smarnaGora.subtitle")} />
        <figure className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm md:p-6">
          <figcaption className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("smarnaGora.timeAxis")}</figcaption>
          <SmarnaGoraChart climbs={climbs} goal={goal} labels={{ age: t("smarnaGora.ageAxis"), time: t("smarnaGora.timeAxis") }} />
          <table className="sr-only">
            <caption>{t("smarnaGora.title")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("smarnaGora.ageAxis")}</th>
                <th scope="col">{t("smarnaGora.timeAxis")}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(t.raw("smarnaGora.times") as Record<string, string>).map(([age, time]) => (
                <tr key={age}>
                  <td>{t("smarnaGora.age", { age })}</td>
                  <td>{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-muted-foreground">{goalLabel}</p>
        </figure>
      </Section>

      <Section>
        <ul className="grid gap-6 sm:grid-cols-3">
          {gallery.map(({ key, position }) => (
            <li key={key}>
              <PhotoFrame
                src={photos[key]}
                alt={site(`photos.${key}.alt`)}
                caption={site(`photos.${key}.caption`)}
                treatment="tinted"
                position={position}
              />
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        title={home("cta.title")}
        text={home("cta.text")}
        action={
          <>
            <Button asChild size="lg" variant="secondary">
              <Link href="/booking">{home("cta.button")}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/contact">{home("cta.secondary")}</Link>
            </Button>
          </>
        }
      />
    </main>
  );
}
