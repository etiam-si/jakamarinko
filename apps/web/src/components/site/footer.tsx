import { ArrowRight, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { BRAND_LINE, Logo } from "@/components/brand/logo";
import { ConsentSettingsLink } from "@/components/consent/consent-settings-link";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { navItems } from "./nav-items";
import { labAddress, labMapsUrl, legalPages } from "./site";

// 44 px tall on phones (thumb targets), compact from md up.
const linkClass =
  "inline-flex min-h-11 min-w-11 items-center text-muted-foreground underline-offset-4 transition-colors duration-(--duration-fast) hover:text-foreground hover:underline md:min-h-8";
const legalKeys = { "/legal/privacy": "privacy", "/legal/terms": "terms", "/legal/cookies": "cookies" } as const;

// The graphite footer (the dark theme's tokens, scoped): the zone strip on top, the logo with the one action, then the
// link columns.
export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("common.nav");
  const actions = useTranslations("common.actions");
  const contact = useTranslations("contact");
  const location = useTranslations("site.location");

  const column = (title: string, items: React.ReactNode[], className?: string) => (
    <div className={className}>
      <h2 className="mb-2 font-mono text-xs tracking-wider text-foreground/70 uppercase md:mb-4">{title}</h2>
      <ul className="flex flex-col text-sm md:gap-1">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="dark bg-background text-foreground">
      <div aria-hidden className="zone-strip h-1" />
      <div className="mx-auto grid max-w-6xl gap-x-6 gap-y-10 px-4 pt-14 pb-10 sm:px-6 md:px-8 md:pt-20 lg:grid-cols-[1.2fr_repeat(4,1fr)] lg:gap-x-10">
        <div className="flex flex-col items-start gap-5 lg:pr-6">
          <Logo className="h-11" />
          <p className="max-w-xs text-pretty text-muted-foreground">{t("tagline")}</p>
          <Button asChild variant="outline" className="mt-1">
            <Link href="/booking">
              {actions("bookTest")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-[1fr_1fr_1.6fr_1.2fr] lg:col-span-4 lg:gap-x-10">
          {column(
            t("explore"),
            navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass}>
                {nav(item.key)}
              </Link>
            )),
          )}
          {column(t("follow"), [
            <a key="instagram" href={contact("instagram.href")} rel="me noopener" target="_blank" className={linkClass}>
              {contact("instagram.label")}
            </a>,
            <a key="strava" href={contact("strava.href")} rel="me noopener" target="_blank" className={linkClass}>
              {contact("strava.label")}
            </a>,
          ])}
          {column(
            t("contact"),
            [
              <a key="phone" href={contact("phone.href")} className={`${linkClass} whitespace-nowrap tabular-nums`}>
                {contact("phone.value")}
              </a>,
              <a key="email" href={contact("email.href")} className={`${linkClass} [overflow-wrap:anywhere]`}>
                {contact("email.value")}
              </a>,
              <a key="maps" href={labMapsUrl} target="_blank" rel="noopener" className={`${linkClass} flex-col items-start justify-center py-1`}>
                <span>{labAddress}</span>
                <span className="flex items-center gap-1 text-xs text-foreground/70">
                  {location("maps")}
                  <ExternalLink aria-hidden className="size-3" />
                </span>
              </a>,
            ],
            "col-span-2 sm:col-span-1",
          )}
          {column(
            t("legal.title"),
            [
              ...legalPages.map((path) => (
                <Link key={path} href={path} className={linkClass}>
                  {t(`legal.${legalKeys[path]}`)}
                </Link>
              )),
              <ConsentSettingsLink key="cookies" className={`${linkClass} cursor-pointer text-left`} />,
            ],
            "col-span-2 sm:col-span-1",
          )}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-6 pb-8 font-mono text-xs text-muted-foreground sm:px-6 md:px-8">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <p className="uppercase tracking-wider">{BRAND_LINE}</p>
        </div>
      </div>
    </footer>
  );
}
