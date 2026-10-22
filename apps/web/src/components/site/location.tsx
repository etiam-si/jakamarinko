import { cn } from "cn";
import { ExternalLink, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { labAddress, labMapsUrl } from "./site";

// Where the tests happen: the address, the area in words and an "Open in maps" link (a plain search URL, no embedded
// map). `children`: the block's call to action.
export function Location({ className, children, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("site.location");
  return (
    <div className={cn("flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm md:p-7", className)} {...props}>
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MapPin aria-hidden className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("title")}</h2>
          <p className="font-heading text-lg font-bold font-stretch-expanded">{t("place")}</p>
          <address className="text-muted-foreground not-italic">
            {labAddress}
            <br />
            {t("area")}
          </address>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={labMapsUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("maps")}
          <ExternalLink aria-hidden className="size-4" />
        </a>
        {children}
      </div>
    </div>
  );
}
