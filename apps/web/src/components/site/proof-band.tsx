import { useTranslations } from "next-intl";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { StatBlock } from "@/components/brand/stat-block";
import { Section } from "@/components/site/section";
import { photos } from "@/components/site/site";

type Stat = "vo2max" | "redBull" | "nationalTeam" | "champion";

// Jaka's own results on the graphite band: the numbers count up, the race photo gets the width. Home shows it in full
// right after the hero. `compact` (lab, ad landing pages): the title and the numbers in one short row, no photo, so the
// same block doesn't fill every page. `action`: the band's call to action; `children`: one line under the stats (the
// disciplines, or who runs the tests).
export function ProofBand({
  action,
  stats = ["vo2max", "redBull", "nationalTeam", "champion"],
  compact = false,
  children,
}: {
  action: React.ReactNode;
  stats?: Stat[];
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const t = useTranslations("home.proof");
  const site = useTranslations("site");

  if (compact) {
    return (
      <Section tone="dark" data-proof className="flex flex-col gap-10 py-12 md:py-16">
        <h2 className="max-w-2xl font-heading text-2xl leading-[1.1] font-bold tracking-tight font-stretch-expanded md:text-3xl">{t("title")}</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 lg:grid-cols-4">
          {stats.map((key, i) => (
            <StatBlock key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} value={t(`${key}.value`)} label={t(`${key}.label`)} />
          ))}
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {children}
          <div className="flex">{action}</div>
        </div>
      </Section>
    );
  }

  return (
    <Section tone="dark" data-proof className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-16">
      <div className="flex flex-col gap-10">
        <div className="flex max-w-xl flex-col gap-4">
          <h2 className="font-heading text-3xl leading-[1.08] font-bold tracking-tight font-stretch-expanded md:text-[2.75rem]">{t("title")}</h2>
          <p className="text-lg text-muted-foreground">{t("text")}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-10">
          {stats.map((key, i) => (
            <StatBlock key={key} data-reveal-item style={{ "--i": i } as React.CSSProperties} value={t(`${key}.value`)} label={t(`${key}.label`)} />
          ))}
        </div>
        {children}
        <div className="flex">{action}</div>
      </div>
      <PhotoFrame
        src={photos.europeans}
        alt={site("photos.europeans.alt")}
        caption={site("photos.europeans.caption")}
        aspect="portrait"
        position="12% 50%"
        sizes="26rem"
        className="hidden lg:flex"
      />
    </Section>
  );
}
