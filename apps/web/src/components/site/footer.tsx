import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { ConsentSettingsLink } from "@/components/consent/consent-settings-link";
import { Link } from "@/i18n/navigation";
import { navItems } from "./nav-items";
import { legalPages } from "./site";

const linkClass = "text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";
const legalKeys = { "/legal/privacy": "privacy", "/legal/terms": "terms", "/legal/cookies": "cookies" } as const;

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("common.nav");
  const contact = useTranslations("contact");

  const column = (title: string, items: React.ReactNode[]) => (
    <div className="flex flex-col gap-3">
      <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{title}</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 md:px-8 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Logo className="h-10 self-start" />
          <p className="text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        {column(
          t("explore"),
          navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {nav(item.key)}
            </Link>
          )),
        )}
        {column(t("contact"), [
          <a key="phone" href={contact("phone.href")} className={linkClass}>
            {contact("phone.value")}
          </a>,
          <a key="email" href={contact("email.href")} className={`${linkClass} break-all`}>
            {contact("email.value")}
          </a>,
        ])}
        {column(t("follow"), [
          <a key="instagram" href={contact("instagram.href")} rel="me noopener" target="_blank" className={linkClass}>
            {contact("instagram.label")}
          </a>,
          <a key="strava" href={contact("strava.href")} rel="me noopener" target="_blank" className={linkClass}>
            {contact("strava.label")}
          </a>,
        ])}
        {column(t("legal.title"), [
          ...legalPages.map((path) => (
            <Link key={path} href={path} className={linkClass}>
              {t(`legal.${legalKeys[path]}`)}
            </Link>
          )),
          <ConsentSettingsLink key="cookies" className={`${linkClass} cursor-pointer text-left`} />,
        ])}
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 font-mono text-xs text-muted-foreground md:px-8">
        {t("copyright", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
