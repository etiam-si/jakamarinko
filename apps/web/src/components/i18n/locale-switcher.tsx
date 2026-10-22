"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Links to the current page in the other languages.
export function LocaleSwitcher() {
  const t = useTranslations("common.localeSwitcher");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="flex gap-3 text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          className="underline-offset-4 hover:underline aria-[current]:font-semibold"
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
