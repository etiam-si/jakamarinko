import { useTranslations } from "next-intl";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { StatBlock } from "@/components/brand/stat-block";
import { Section } from "@/components/site/section";
import { photos } from "@/components/site/site";

const stats = ["vo2max", "redBull", "nationalTeam", "champion"] as const;

// Jaka's own results on the graphite band: the numbers count up, the race photo gets the width. Home, lab and the ad
// landing pages show it right after the hero. `action`: the band's call to action.
export function ProofBand({ action }: { action: React.ReactNode }) {
  const t = useTranslations("home.proof");
  const site = useTranslations("site");
  return (
    <Section tone="dark" className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-16">
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
        <div className="flex">{action}</div>
      </div>
      <PhotoFrame
        src={photos.europeans}
        alt={site("photos.europeans.alt")}
        caption={site("photos.europeans.caption")}
        aspect="portrait"
        position="12% 50%"
        sizes="(min-width: 1024px) 26rem, calc(100vw - 2rem)"
        className="max-lg:max-w-md"
      />
    </Section>
  );
}
