import type { Locale } from "@jakamarinko/types";
import { useFormatter, useTranslations } from "next-intl";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { PriceCard } from "@/components/brand/price-card";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatBlock } from "@/components/brand/stat-block";
import { Faq } from "@/components/site/faq";
import { CtaBand, Section } from "@/components/site/section";
import { eurFormat, euros, photos } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { type BlockName, type LandingPage, offerItem } from "./pages";

type Props = { page: LandingPage; locale: Locale };

// The page's single action; every block ends with it.
function Action({ page, locale, variant = "default" }: Props & { variant?: "default" | "outline" | "secondary" }) {
  const t = useTranslations(`landing.pages.${page.slug}`);
  return (
    <Button asChild size="lg" variant={variant} className="h-11 self-start px-5 text-base">
      <Link href={offerItem(page.offer, locale).href}>{t("cta")}</Link>
    </Button>
  );
}

function Hero({ page, locale }: Props) {
  const t = useTranslations(`landing.pages.${page.slug}`);
  const site = useTranslations("site");
  const format = useFormatter();
  const item = offerItem(page.offer, locale);
  const price = format.number(euros(item.priceCents), eurFormat);
  return (
    <Section className="grid items-center gap-10 pt-8 md:grid-cols-[1fr_auto] md:pt-14">
      <div className="flex flex-col gap-6">
        <SectionHeading as="h1" eyebrow={t("hero.eyebrow")} title={t("hero.title")} lead={t("hero.lead")} />
        <div className="flex flex-wrap items-center gap-4">
          <Action page={page} locale={locale} />
          <span className="font-heading text-2xl font-extrabold tabular-nums font-stretch-expanded">
            {price}
            {item.monthly && <span className="ml-1.5 font-sans text-sm font-normal text-muted-foreground">{site("perMonth")}</span>}
          </span>
        </div>
      </div>
      <PhotoFrame
        src={photos[page.photo]}
        alt={site(`photos.${page.photo}.alt`)}
        caption={site(`photos.${page.photo}.caption`)}
        className="mx-auto hidden md:flex md:w-72 lg:w-80"
      />
    </Section>
  );
}

const pointKeys = ["one", "two", "three"] as const;

function Points({ page, locale }: Props) {
  const t = useTranslations(`landing.pages.${page.slug}.points`);
  const blocks = useTranslations("landing.blocks");
  return (
    <Section className="flex flex-col gap-8 border-t border-border">
      <SectionHeading title={blocks("points")} />
      <ul className="grid gap-8 sm:grid-cols-3">
        {pointKeys.map((key, i) => (
          <li key={key} className="flex flex-col gap-2">
            <span aria-hidden className="font-mono text-xs text-muted-foreground tabular-nums">
              0{i + 1}
            </span>
            <h3 className="font-heading text-lg font-bold font-stretch-expanded">{t(`${key}.title`)}</h3>
            <p className="text-muted-foreground">{t(`${key}.text`)}</p>
          </li>
        ))}
      </ul>
      <Action page={page} locale={locale} variant="outline" />
    </Section>
  );
}

const proofKeys = ["vo2max", "redBull", "nationalTeam", "champion"] as const;

// Jaka's own results, the same numbers as on the home page.
function Proof({ page, locale }: Props) {
  const t = useTranslations("home.proof");
  return (
    <Section className="flex flex-col gap-10 bg-secondary/40 md:rounded-lg">
      <h2 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded md:text-3xl">{t("title")}</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {proofKeys.map((key) => (
          <StatBlock key={key} value={t(`${key}.value`)} label={t(`${key}.label`)} />
        ))}
      </div>
      <Action page={page} locale={locale} variant="outline" />
    </Section>
  );
}

function Price({ page, locale }: Props) {
  const blocks = useTranslations("landing.blocks");
  const common = useTranslations("common");
  const site = useTranslations("site");
  const format = useFormatter();
  const item = offerItem(page.offer, locale);
  return (
    <Section className="flex flex-col gap-8">
      <SectionHeading title={blocks("price")} lead={common("units.vatIncluded")} />
      <PriceCard
        name={item.name}
        price={format.number(euros(item.priceCents), eurFormat)}
        period={item.monthly ? site("perMonth") : undefined}
        description={item.description}
        features={item.features}
        featured
        className="max-w-md"
        action={<Action page={page} locale={locale} />}
      />
    </Section>
  );
}

function Questions({ page, locale }: Props) {
  const t = useTranslations();
  return (
    <Section className="flex flex-col gap-8">
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

// A landing page: its blocks in the configured order.
export function LandingBlocks({ page, locale }: Props) {
  return (
    <main>
      {page.blocks.map((name) => {
        const Block = blocks[name];
        return <Block key={name} page={page} locale={locale} />;
      })}
    </main>
  );
}
