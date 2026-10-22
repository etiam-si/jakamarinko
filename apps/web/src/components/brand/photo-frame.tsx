import { cn } from "cn";
import Image from "next/image";

const aspects = { portrait: "aspect-[4/5]", square: "aspect-square", landscape: "aspect-[3/2]" };

// How athlete photos are shown. The photos we have are small, so frames stay small (max-w-sm by default) and
// "tinted" maps the photo to the brand's spruce, which hides compression and mixed colour casts. Never full-bleed.
export function PhotoFrame({
  src,
  alt,
  caption,
  aspect = "portrait",
  treatment = "natural",
  position = "center",
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  aspect?: keyof typeof aspects;
  treatment?: "natural" | "tinted";
  position?: string;
  className?: string;
}) {
  return (
    <figure className={cn("flex w-full max-w-sm flex-col gap-2", className)}>
      <div className={cn("relative overflow-hidden rounded-md bg-muted", aspects[aspect])}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 640px) 24rem, 100vw"
          className={cn("object-cover", treatment === "tinted" && "contrast-110 grayscale")}
          style={{ objectPosition: position }}
        />
        {treatment === "tinted" && <div aria-hidden className="absolute inset-0 bg-photo-tint mix-blend-color" />}
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
