import type { Locale } from "@jakamarinko/types";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { PriceCard } from "@/components/brand/price-card";
import { SectionHeading } from "@/components/brand/section-heading";
import { Faq } from "@/components/site/faq";
import { Location } from "@/components/site/location";
import { ProofBand } from "@/components/site/proof-band";
import { CtaBand, Section } from "@/components/site/section";
import { euro, euros, photos } from "@/components/site/site";
import { StickyBook } from "@/components/site/sticky-book";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { type BlockName, type LandingPage, offerItem } from "./pages";

type Props = { page: LandingPage; locale: Locale };

// The page's single action; every block ends with it. `primary`: the one in the hero.
function Action({ page, locale, variant = "default", primary = false }: Props & { variant?: "default" | "outline" | "secondary"; primary?: boolean }) {
  const t = useTranslations(`landing.pages.${page.slug}`);
  return (
    <Button asChild size="lg" variant={variant} className="w-full sm:w-auto sm:self-start" data-cta={primary ? "primary" : "secondary"}>
      <Link href={offerItem(page.offer, locale).href}>
        {t("cta")}
        <ArrowRight aria-hidden />
      </Link>
    </Button>
  );
}

// The numbers the leads quote ("90 €", "250 € instead of 360 €") come from the catalog, never from the copy.
function usePrices(page: LandingPage, locale: Locale) {
  const format = useFormatter();
  const item = offerItem(page.offer, locale);
  const plain = (cents: number) => format.number(euros(cents), { maximumFractionDigits: 2 });
  return {
    item,
    price: euro(format, item.priceCents),
    values: { price: plain(item.priceCents), separate: "separateCents" in item && item.separateCents ? plain(item.separateCents) : "" },
  };
}

function Hero({ page, locale }: Props) {
  const t = useTranslations(`landing.pages.${page.slug}`);
  const site = useTranslations("site");
  const lab = useTranslations("lab.hero");
  const { item, price, values } = usePrices(page, locale);
  return (
    <Section
      reveal={false}
      className="grid items-center gap-12 pt-8 pb-16 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16 lg:pt-16"
    >
      <div className="flex flex-col gap-8">
        <SectionHeading as="h1" eyebrow={t("hero.eyebrow")} title={t("hero.title", values)} lead={t("hero.lead", values)} />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Action page={page} locale={locale} primary />
            <p className="flex items-baseline gap-1.5 font-heading text-2xl font-extrabold tabular-nums font-stretch-expanded max-sm:justify-center">
              {price}
              {item.monthly && <span className="font-sans text-sm font-normal text-muted-foreground">{site("perMonth")}</span>}
            </p>
          </div>
          {page.offer.kind === "test" && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              {lab("trust")} · {site("location.trust")}
            </p>
          )}
        </div>
      </div>
      <PhotoFrame
        src={photos[page.photo]}
        alt={site(`photos.${page.photo}.alt`)}
        caption={site(`photos.${page.photo}.caption`)}
        hero
        depth
        strip
        sizes="(min-width: 1024px) 24rem, (min-width: 640px) 24rem, calc(100vw - 2.625rem)"
        className="mx-auto max-w-sm lg:max-w-none"
      />
    </Section>
  );
}

const pointKeys = ["one", "two", "three"] as const;

function Points({ page, locale }: Props) {
  const t = useTranslations(`landing.pages.${page.slug}.points`);
  const blocks = useTranslations("landing.blocks");
  return (
    <Section className="flex flex-col gap-10">
      <SectionHeading title={blocks("points")} />
      <ul className="grid gap-4 sm:grid-cols-3">
        {pointKeys.map((key, i) => (
          <li key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} className="flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-sm">
            <span aria-hidden className="h-1 w-10 rounded-full zone-strip" />
            <h3 className="font-heading text-lg font-bold font-stretch-expanded">{t(`${key}.title`)}</h3>
            <p className="text-muted-foreground">{t(`${key}.text`)}</p>
          </li>
        ))}
      </ul>
      <Action page={page} locale={locale} variant="outline" />
    </Section>
  );
}

// Jaka's own results on the graphite band, the same numbers as on the home page.
function Proof({ page, locale }: Props) {
  return <ProofBand action={<Action page={page} locale={locale} variant="outline" />} />;
}

function Price({ page, locale }: Props) {
  const blocks = useTranslations("landing.blocks");
  const common = useTranslations("common");
  const site = useTranslations("site");
  const lab = useTranslations("lab.tests");
  const { item, price, values } = usePrices(page, locale);
  return (
    <Section className="flex flex-col gap-10">
      <SectionHeading title={blocks("price")} lead={common("units.vatIncluded")} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,22rem)]">
        <PriceCard
          name={item.name}
          price={price}
          period={item.monthly ? site("perMonth") : undefined}
          description={values.separate ? lab("separatelyOnly", { price: values.separate }) : item.description}
          features={item.features}
          featured
          action={<Action page={page} locale={locale} />}
        />
        <Location />
      </div>
    </Section>
  );
}

function Questions({ page, locale }: Props) {
  const t = useTranslations();
  return (
    <Section className="flex flex-col gap-10">
      <SectionHeading title={t("landing.blocks.faq")} />
      <Faq items={page.faq.map((key) => ({ question: t(`${key}.question`), answer: t(`${key}.answer`) }))} />
      <Action page={page} locale={locale} variant="outline" />
    </Section>
  );
}

function Close({ page, locale }: Props) {
  const t = useTranslations(`landing.pages.${page.slug}`);
  return <CtaBand title={t("close.title")} text={t("close.text")} action={<Action page={page} locale={locale} variant="secondary" />} />;
}

const blocks: Record<BlockName, (props: Props) => React.ReactNode> = {
  hero: Hero,
  points: Points,
  proof: Proof,
  price: Price,
  faq: Questions,
  cta: Close,
};

// A landing page: its blocks in the configured order, and the offer pinned to the bottom on phones once the hero's
// button has scrolled away.
export function LandingBlocks({ page, locale }: Props) {
  const t = useTranslations(`landing.pages.${page.slug}`);
  const site = useTranslations("site");
  const { item, price } = usePrices(page, locale);
  return (
    <main>
      {page.blocks.map((name) => {
        const Block = blocks[name];
        return <Block key={name} page={page} locale={locale} />;
      })}
      <StickyBook from={site("sticky.offer", { name: item.name, price })} href={item.href} label={t("cta")} always />
    </main>
  );
}
