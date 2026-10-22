"use client";

import { cn } from "cn";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// One button named "Language" with the current language on it; its menu lists the languages, each a link to this
// page in that language. The query and hash come along (a booking mid-flow keeps its service), read on click so
// the page can stay static. `full`: the language's whole name on the button, for the phone menu.
export function LanguageMenu({ full = false, className }: { full?: boolean; className?: string }) {
  const t = useTranslations("common.localeSwitcher");
  const label = useTranslations("header.language")("label");
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={label}
          data-locale-switch
          className={cn("group h-10 gap-1.5 px-2.5 has-[>svg]:px-2.5", full && "h-11 w-full justify-between gap-2 px-3 has-[>svg]:px-3", className)}
        >
          <Globe aria-hidden className="text-muted-foreground" />
          {full ? (
            <span className="mr-auto text-base font-medium">{t(current)}</span>
          ) : (
            <span className="font-mono text-xs tracking-wider uppercase">{current}</span>
          )}
          <ChevronDown aria-hidden className="size-3.5 text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180 motion-reduce:transition-none" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-48 min-w-48">
        {routing.locales.map((locale) => (
          <DropdownMenuItem key={locale} asChild className="min-h-11 gap-3 px-3">
            <Link
              href={pathname}
              locale={locale}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              onClick={(e) => keepQuery(e, locale)}
            >
              <span className="w-6 font-mono text-xs tracking-wider text-muted-foreground uppercase" aria-hidden>
                {locale}
              </span>
              <span className="flex-1">{t(locale)}</span>
              {locale === current && <Check aria-hidden className="text-primary" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
