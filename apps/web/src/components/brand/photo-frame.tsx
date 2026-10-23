import { cn } from "cn";
import Image from "next/image";

const aspects = { portrait: "aspect-[4/5]", square: "aspect-square", landscape: "aspect-[3/2]", wide: "aspect-[16/9]" };

// How athlete photos are shown. The photos we have are small, so a frame is never wider than half the photo's own
// width on a phone (sharp on a 3× screen; e2e checks it). "tinted" maps the photo to the brand's spruce, which hides
// compression and mixed colour casts; on hover (mouse only) it warms back to natural colour.
// `depth`: a spruce slab offset behind the photo and a deeper shadow, for the one hero photo of a page.
// `strip`: the zone colours along the bottom edge. `hero`: loads first and settles in from a slight zoom
// (transform only, so it still paints at once). `overlay`: a race bib or a label laid over the photo. `flush`: no
// corners, shadow or edge, for a photo that is the top of a card.
export function PhotoFrame({
  src,
  alt,
  caption,
  aspect = "portrait",
  treatment = "natural",
  position = "center",
  hero = false,
  depth = false,
  strip = false,
  flush = false,
  sizes = "(min-width: 640px) 24rem, 100vw",
  overlay,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  // A named ratio, or Tailwind aspect classes for a ratio that changes with the width.
  aspect?: keyof typeof aspects | (string & {});
  treatment?: "natural" | "tinted";
  position?: string;
  hero?: boolean;
  depth?: boolean;
  strip?: boolean;
  flush?: boolean;
  // The width the frame is shown at, at each breakpoint.
  sizes?: string;
  overlay?: React.ReactNode;
  className?: string;
}) {
  const tinted = treatment === "tinted";
  return (
    <figure className={cn("group/photo relative flex w-full flex-col", depth ? "gap-6 md:gap-8" : "gap-3", className)}>
      <div className={cn("relative", depth && "mr-2.5 md:mr-4")}>
        {depth && (
          <div
            aria-hidden
            className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-2xl bg-linear-to-br from-primary to-primary-deep md:translate-x-4 md:translate-y-4"
          />
        )}
        <div
          className={cn("relative isolate overflow-hidden bg-muted", !flush && "rounded-2xl", !flush && (depth ? "shadow-xl" : "shadow-md"), aspects[aspect as keyof typeof aspects] ?? aspect)}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            preload={hero}
            fetchPriority={hero ? "high" : undefined}
            className={cn(
              "object-cover",
              hero && "motion-safe:animate-settle",
              tinted &&
                "contrast-110 grayscale transition-[filter] duration-500 ease-(--ease-out-quart) [@media(hover:hover)]:group-hover/photo:contrast-100 [@media(hover:hover)]:group-hover/photo:grayscale-0",
            )}
            style={{ objectPosition: position }}
          />
          {tinted && (
            <div
              aria-hidden
              className="absolute inset-0 bg-photo-tint mix-blend-color transition-opacity duration-500 ease-(--ease-out-quart) [@media(hover:hover)]:group-hover/photo:opacity-0"
            />
          )}
          {/* A soft inner edge, so a light photo doesn't bleed into a light page. */}
          {!flush && <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-foreground/10 ring-inset" />}
          {strip && (
            <div
              aria-hidden
              className="zone-strip absolute inset-x-0 bottom-0 h-1.5 origin-left motion-safe:animate-fill-x motion-safe:[animation-delay:300ms]"
            />
          )}
        </div>
        {overlay}
      </div>
      {caption && (
        <figcaption className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span aria-hidden className="h-px w-4 bg-signal" />
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
