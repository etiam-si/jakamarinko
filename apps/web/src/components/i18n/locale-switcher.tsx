"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// A compact EN | SL switch: links to the current page in each language, the current one filled. Each link is named
// with the language's full name. Used where there's no room for the header's language menu (ad landing pages).
export function LocaleSwitcher() {
  const t = useTranslations("common.localeSwitcher");
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function keepQuery(e: React.MouseEvent, locale: string) {
    const rest = location.search + location.hash;
    if (!rest || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    router.push(pathname + rest, { locale });
  }

  return (
    <nav aria-label={t("label")} className="flex rounded-full border bg-card p-0.5 shadow-xs">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          hrefLang={locale}
          lang={locale}
          aria-label={t(locale)}
          aria-current={locale === current ? "true" : undefined}
          onClick={(e) => keepQuery(e, locale)}
          className="flex h-11 min-w-11 items-center justify-center rounded-full px-3 font-mono text-xs tracking-wider text-muted-foreground uppercase transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30 aria-[current]:bg-foreground aria-[current]:text-background"
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}
