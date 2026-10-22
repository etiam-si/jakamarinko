import { Check } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { photos } from "@/components/site/site";
import { Link } from "@/i18n/navigation";

const points = ["bookings", "faster", "data"] as const;
const pins = ["top-2.5 left-2.5", "top-2.5 right-2.5", "bottom-2.5 left-2.5", "bottom-2.5 right-2.5"];

// The deep spruce half of the sign-in screen: Jaka at a finish line, pinned on like a race number, and what an
// account gives you. Next to the form from lg up; under it on smaller screens, without the photo, so the form stays
// the first thing on a phone.
export function BrandPanel() {
  const t = useTranslations("auth.panel");
  const nav = useTranslations("common.nav");
  const photo = useTranslations("site.photos.finish");
  return (
    <aside className="relative isolate overflow-hidden rounded-3xl bg-primary-deep lg:sticky lg:top-3 lg:h-[calc(100dvh-1.5rem)] lg:min-h-[40rem]">
      <div className="dark flex h-full flex-col gap-10 bg-[radial-gradient(70%_50%_at_100%_0%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_70%),radial-gradient(60%_40%_at_0%_100%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_70%)] p-6 text-foreground sm:p-10 xl:p-14">
        <Link
          href="/"
          aria-label={nav("home")}
          className="hidden self-start rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 lg:block"
        >
          <Logo className="h-10" />
        </Link>

        <figure className="hidden flex-1 flex-col items-center justify-center gap-4 lg:flex">
          <div className="relative w-full max-w-[17rem] -rotate-2 rounded-xl bg-foreground p-2.5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55)] xl:max-w-[19rem]">
            {pins.map((p) => (
              <span key={p} aria-hidden className={`absolute z-10 size-2 rounded-full bg-background shadow-[inset_0_1px_1px_rgb(0_0_0/0.5)] ${p}`} />
            ))}
            <div className="relative aspect-[4/5] overflow-hidden rounded-md">
              <Image src={photos.finish} alt={photo("alt")} fill sizes="19rem" className="object-cover" style={{ objectPosition: "50% 25%" }} />
            </div>
          </div>
          <figcaption className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span aria-hidden className="h-px w-4 bg-signal" />
            {photo("caption")}
          </figcaption>
        </figure>

        <div className="flex flex-col gap-5">
          <p className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {t("eyebrow")}
          </p>
          <p className="max-w-md font-heading text-2xl leading-[1.1] font-bold tracking-tight text-balance font-stretch-expanded sm:text-3xl">
            {t("title")}
          </p>
          <ul className="flex max-w-md flex-col gap-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-pretty text-foreground/85">
                <span aria-hidden className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Check className="size-3 text-primary" strokeWidth={3} />
                </span>
                {t(`points.${p}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
