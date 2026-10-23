import { ArrowRight, Medal } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { sports } from "@jakamarinko/types";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatBlock } from "@/components/brand/stat-block";
import { ClimbChart } from "@/components/site/climb-chart";
import { climbsFrom, toSeconds } from "@/components/site/climbs";
import { PhotoSlot } from "@/components/site/photo-slot";
import { CtaBand, Section } from "@/components/site/section";
import { bookingHref, pageMetadata, photos } from "@/components/site/site";
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
// The photos are small: on phones the finish fills the width (720 px source), skimo and skating share a row.
const gallery = [
  { key: "finish", position: "75% 35%", className: "col-span-2 max-w-[22.5rem] sm:col-span-1 sm:max-w-none", aspect: "aspect-[3/2] sm:aspect-[4/5]" },
  { key: "skimo", position: "50% 30%", className: "", aspect: "portrait" },
  { key: "xcSki", position: "30% 30%", className: "", aspect: "portrait" },
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

  const bookLactate = (variant: "default" | "outline" = "outline", primary = false) => (
    <Button asChild size="lg" variant={variant} data-cta={primary ? "primary" : "secondary"}>
      <Link href={bookingHref("lactate-profile")}>
        {home("hero.primaryCta")}
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
        <div className="hero-screen flex flex-col gap-8">
          <SectionHeading as="h1" eyebrow={common("brand.name")} title={t("title")} lead={t("intro")} />
          <div className="flex flex-col gap-3 sm:flex-row">
            {bookLactate("default", true)}
            <Button asChild size="lg" variant="outline">
              <Link href="/coaching">{t("hero.secondaryCta")}</Link>
            </Button>
          </div>
          <div className="flex max-w-prose flex-col gap-4 text-pretty">
            {bio.map((p) => (
              <p key={p}>{t(`bio.${p}`)}</p>
            ))}
          </div>
        </div>
        <PhotoSlot
          slot="aboutPortrait"
          className="mx-auto max-w-md lg:max-w-none"
          fallback={
            <PhotoFrame
              src={photos.trail}
              alt={site("photos.trail.alt")}
              caption={site("photos.trail.caption")}
              position="62% 75%"
              hero
              depth
              strip
              sizes="(min-width: 1024px) 26rem, (min-width: 640px) 28rem, calc(100vw - 2.625rem)"
              className="mx-auto max-w-md lg:max-w-none"
            />
          }
        />
      </Section>

      <Section tone="dark" data-proof className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="flex flex-col gap-10">
          <SectionHeading title={t("achievements.title")} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10">
            {(["vo2max", "redBull"] as const).map((key, i) => (
              <StatBlock key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} value={home(`proof.${key}.value`)} label={home(`proof.${key}.label`)} />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("disciplines.title")}</h3>
            <ul className="flex flex-wrap gap-1.5">
              {sports.map((sport) => (
                <li key={sport} className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                  {common(`sports.${sport}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {achievements.map((key, i) => (
              <li key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} className="flex items-start gap-4 py-4">
                <Medal aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>{t(`achievements.${key}`)}</span>
              </li>
            ))}
          </ul>
          {!qualifications.startsWith("TODO") && (
            <div className="flex flex-col gap-2">
              <h3 className="font-heading text-xl font-bold font-stretch-expanded">{t("qualifications.title")}</h3>
              <p className="text-muted-foreground">{qualifications}</p>
            </div>
          )}
          <div className="flex">{bookLactate()}</div>
        </div>
      </Section>

      <Section className="flex flex-col gap-10">
        <SectionHeading title={t("smarnaGora.title")} lead={t("smarnaGora.subtitle")} />
        <figure className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-md md:p-6">
          <figcaption className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("smarnaGora.timeAxis")}</figcaption>
          <ClimbChart climbs={climbs} goal={goal} ageLabel={(age) => t("smarnaGora.age", { age })} />
          <div className="sr-only">
          <table>
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
          </div>
          <p className="text-sm text-muted-foreground">{goalLabel}</p>
        </figure>
        <div className="flex">
          <Button asChild size="lg" variant="outline" data-cta="secondary">
            <Link href="/coaching">
              {t("hero.secondaryCta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      <Section className="pt-0 md:pt-0">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6">
          {gallery.map(({ key, position, className, aspect }, i) => (
            <li key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} className={className}>
              <PhotoFrame
                src={photos[key]}
                alt={site(`photos.${key}.alt`)}
                caption={site(`photos.${key}.caption`)}
                aspect={aspect}
                position={position}
                sizes={key === "finish" ? "(min-width: 640px) 33vw, calc(100vw - 2rem)" : "(min-width: 640px) 33vw, 50vw"}
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
            <Button asChild size="lg" variant="secondary" data-cta="secondary">
              <Link href={bookingHref("lactate-profile")}>
                {home("cta.button")}
                <ArrowRight aria-hidden />
              </Link>
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
