import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Logo } from "@/components/brand/logo";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { PriceCard } from "@/components/brand/price-card";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatBlock } from "@/components/brand/stat-block";
import { ZoneBar } from "@/components/brand/zone-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { chartTokens, readTheme, type Theme, zoneTokens } from "@/styles/tokens";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "brand.styleguide" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const coreTokens = [
  "background", "foreground", "card", "primary", "primary-foreground", "secondary", "secondary-foreground",
  "muted", "muted-foreground", "signal", "destructive", "border", "input", "ring",
];

// Renders the same content on a light and a dark panel, side by side on wide screens.
function Both({ children, labels }: { children: (theme: Theme) => React.ReactNode; labels: Record<Theme, string> }) {
  return (
    <div className="grid overflow-hidden rounded-lg ring-1 ring-border lg:grid-cols-2">
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} className={theme === "dark" ? "dark min-w-0 bg-background p-6 text-foreground md:p-8" : "min-w-0 bg-background p-6 md:p-8"}>
          <p className="mb-6 font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">{labels[theme]}</p>
          {children(theme)}
        </div>
      ))}
    </div>
  );
}

function Swatches({ names, tokens }: { names: string[]; tokens: Record<string, string> }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {names.map((name) => (
        <li key={name} className="flex items-center gap-3">
          <span className="size-10 shrink-0 rounded-md ring-1 ring-foreground/10" style={{ background: `var(--${name})` }} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium">{name}</span>
            <span className="font-mono text-[0.65rem] text-muted-foreground uppercase">{tokens[name]}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Styleguide({ params }: Props) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("brand.styleguide");
  const format = useFormatter();
  const theme = readTheme();
  const labels = { light: t("light"), dark: t("dark") };
  const eur = (amount: number) => format.number(amount, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const bpm = t("zones.unit");
  const zones = [
    { name: t("zones.z1"), range: `< 138 ${bpm}`, share: 38 },
    { name: t("zones.z2"), range: `138–152 ${bpm}`, share: 15 },
    { name: t("zones.z3"), range: `153–171 ${bpm}`, share: 19 },
    { name: t("zones.z4"), range: `172–179 ${bpm}`, share: 8 },
    { name: t("zones.z5"), range: `≥ 180 ${bpm}`, share: 17 },
  ];
  const features = ["vo2max", "lactate", "fat", "anthropometry", "zones"] as const;

  const section = (title: string, note: string | null, body: React.ReactNode) => (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-bold font-stretch-expanded">{title}</h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      {body}
    </section>
  );

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-12 md:px-8">
      <SectionHeading as="h1" eyebrow="Jaka Marinko" title={t("title")} lead={t("lead")} />

      {section(
        t("sections.logo"),
        t("sections.logoNote"),
        <Both labels={labels}>
          {() => (
            <div className="flex flex-col gap-10">
              <Logo className="h-16 self-start sm:h-24" />
              <Logo className="h-10 self-start" />
              <div className="flex items-end gap-6">
                {["h-4", "h-8", "h-16", "h-32"].map((size) => (
                  <Logo key={size} variant="mark" className={size} />
                ))}
              </div>
            </div>
          )}
        </Both>,
      )}

      {section(
        t("sections.colours"),
        null,
        <Both labels={labels}>
          {(mode) => (
            <div className="flex flex-col gap-8">
              <Swatches names={coreTokens} tokens={theme[mode]} />
              <div className="flex flex-col gap-3">
                <h3 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("sections.zones")}</h3>
                <Swatches names={zoneTokens} tokens={theme[mode]} />
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("sections.charts")}</h3>
                <Swatches names={chartTokens} tokens={theme[mode]} />
              </div>
            </div>
          )}
        </Both>,
      )}

      {section(
        t("sections.type"),
        null,
        <Both labels={labels}>
          {() => (
            <div className="flex flex-col gap-5">
              <p className="font-heading text-4xl leading-none font-extrabold tracking-tight font-stretch-expanded sm:text-5xl">{t("type.display")}</p>
              <p className="font-heading text-2xl font-bold font-stretch-expanded">{t("type.heading")}</p>
              <p className="max-w-prose text-base">{t("type.body")}</p>
              <p className="text-sm text-muted-foreground">{t("type.small")}</p>
              <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("type.label")}</p>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">{t("type.tabular")}</p>
                <div className="grid grid-cols-2 gap-4 text-2xl font-semibold">
                  <div>
                    <p className="font-mono text-[0.65rem] font-normal text-muted-foreground uppercase">{t("type.proportional")}</p>
                    <p>12:33</p>
                    <p>11:11</p>
                    <p>4:05 /km</p>
                  </div>
                  <div className="tabular-nums">
                    <p className="font-mono text-[0.65rem] font-normal text-muted-foreground uppercase">{t("type.tabularLabel")}</p>
                    <p>12:33</p>
                    <p>11:11</p>
                    <p>4:05 /km</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Both>,
      )}

      {section(
        t("sections.primitives"),
        null,
        <Both labels={labels}>
          {(mode) => (
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap gap-3">
                <Button>{t("samples.button")}</Button>
                <Button variant="secondary">{t("samples.secondary")}</Button>
                <Button variant="outline">{t("samples.outline")}</Button>
                <Button variant="ghost">{t("samples.ghost")}</Button>
                <Button variant="destructive">{t("samples.destructive")}</Button>
                <Button variant="link">{t("samples.link")}</Button>
              </div>
              <div className="grid max-w-md gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={`email-${mode}`}>{t("samples.emailLabel")}</Label>
                  <Input id={`email-${mode}`} type="email" placeholder={t("samples.emailPlaceholder")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`message-${mode}`}>{t("samples.messageLabel")}</Label>
                  <Textarea id={`message-${mode}`} placeholder={t("samples.messagePlaceholder")} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id={`consent-${mode}`} />
                  <Label htmlFor={`consent-${mode}`}>{t("samples.consent")}</Label>
                </div>
              </div>
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle>{t("samples.cardTitle")}</CardTitle>
                  <CardDescription className="tabular-nums">{t("samples.cardDescription")}</CardDescription>
                </CardHeader>
                <CardContent>{t("samples.cardBody")}</CardContent>
              </Card>
            </div>
          )}
        </Both>,
      )}

      {section(
        t("sections.brand"),
        null,
        <Both labels={labels}>
          {() => (
            <div className="flex flex-col gap-12">
              <SectionHeading eyebrow={t("heading.eyebrow")} title={t("heading.title")} lead={t("heading.lead")} />
              <div className="grid gap-8 sm:grid-cols-3">
                <StatBlock value="80" unit="ml/kg/min" label={t("stats.vo2max")} />
                <StatBlock value={t("stats.redbullValue")} label={t("stats.redbull")} />
                <StatBlock value="12:33" unit="min" label={t("stats.smarna")} />
              </div>
              <ZoneBar label={t("zones.label")} zones={zones} />
              <div className="grid gap-4 sm:grid-cols-2">
                <PriceCard
                  name={t("prices.lactate")}
                  price={eur(90)}
                  description={t("prices.lactateDescription")}
                  action={<Button className="w-full">{t("prices.book")}</Button>}
                />
                <PriceCard
                  name={t("prices.performance")}
                  price={eur(250)}
                  description={t("prices.performanceDescription")}
                  features={features.map((f) => t(`prices.performanceFeatures.${f}`))}
                  badge={t("prices.popular")}
                  featured
                  action={<Button className="w-full">{t("prices.book")}</Button>}
                />
              </div>
            </div>
          )}
        </Both>,
      )}

      {section(
        t("sections.photos"),
        t("sections.photosNote"),
        <Both labels={labels}>
          {() => (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <PhotoFrame src="/brand/photos/jaka-turno-smucanje.jpg" alt={t("photos.alt")} caption={t("photos.skimo")} />
              <PhotoFrame src="/brand/photos/jaka-gorski-tek.jpg" alt={t("photos.alt")} caption={t("photos.trail")} treatment="tinted" />
              <PhotoFrame src="/brand/photos/jaka-redbull-400.png" alt={t("photos.alt")} caption={t("photos.redbull")} aspect="square" treatment="tinted" />
            </div>
          )}
        </Both>,
      )}
    </main>
  );
}
