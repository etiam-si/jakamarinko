import { cn } from "cn";
import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { showPlaceholders } from "./site";

// Photos the design wants and we don't have yet. The brief per slot (site.shots.<slot> in the messages) is also in
// docs/content/shot-list.md for the photographer.
export const shotSlots = {
  labHero: "aspect-[4/5]",
  labSample: "aspect-[3/2]",
  coachingHero: "aspect-[4/5]",
  aboutPortrait: "aspect-[4/5]",
  contactLab: "aspect-[4/5]",
} as const;
export type ShotSlot = keyof typeof shotSlots;

// With NEXT_PUBLIC_SHOW_PLACEHOLDERS=true: a designed frame in the slot's aspect ratio that says exactly which photo
// goes here. Otherwise `fallback`: the best photo we have, or nothing, so the section adapts.
export function PhotoSlot({ slot, fallback = null, className }: { slot: ShotSlot; fallback?: React.ReactNode; className?: string }) {
  const t = useTranslations("site.shots");
  if (!showPlaceholders) return fallback;
  return (
    <figure
      data-photo-slot={slot}
      className={cn(
        "relative flex w-full flex-col justify-end overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-linear-to-br from-secondary to-muted p-6 text-secondary-foreground",
        shotSlots[slot],
        className,
      )}
    >
      <div aria-hidden className="zone-strip absolute inset-x-0 top-0 h-1 opacity-70" />
      <span className="mb-auto flex size-10 items-center justify-center rounded-full bg-card text-primary shadow-sm">
        <Camera aria-hidden className="size-5" />
      </span>
      <figcaption className="flex flex-col gap-2">
        <span className="font-mono text-xs tracking-wider uppercase">{t("label")}</span>
        <span className="text-sm text-pretty">{t(slot)}</span>
      </figcaption>
    </figure>
  );
}
