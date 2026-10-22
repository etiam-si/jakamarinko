import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { ConsentSettingsLink } from "@/components/consent/consent-settings-link";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { legalPages } from "@/components/site/site";
import { Link } from "@/i18n/navigation";

// Ad traffic sees one offer: no menu, only the logo and the language switch.
export function LandingHeader() {
  const t = useTranslations("common.nav");
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" aria-label={t("home")} className="shrink-0 rounded-sm">
          <Logo className="h-9" />
        </Link>
        <LocaleSwitcher />
      </div>
    </header>
  );
}

const linkClass = "underline-offset-4 transition-colors hover:text-foreground hover:underline";
const legalKeys = { "/legal/privacy": "privacy", "/legal/terms": "terms", "/legal/cookies": "cookies" } as const;

// Only what the law asks for: the legal pages and the cookie settings.
export function LandingFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-sm text-muted-foreground md:px-8">
        <span className="font-mono text-xs">{t("copyright", { year: new Date().getFullYear() })}</span>
        {legalPages.map((path) => (
          <Link key={path} href={path} className={linkClass}>
            {t(`legal.${legalKeys[path]}`)}
          </Link>
        ))}
        <ConsentSettingsLink className={`${linkClass} cursor-pointer`} />
      </div>
    </footer>
  );
}
