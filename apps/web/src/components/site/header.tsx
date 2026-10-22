import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

export function Header() {
  const t = useTranslations("common");
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-8">
        <Link href="/" aria-label={t("nav.home")} className="shrink-0 rounded-sm">
          <Logo variant="mark" className="h-9 sm:hidden" />
          <Logo className="hidden h-9 sm:block" />
        </Link>
        <nav aria-label={t("nav.label")} className="ml-auto hidden md:block">
          <NavLinks className="flex items-center gap-1" />
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <div className="hidden md:block">
            <LocaleSwitcher />
          </div>
          {/* Phones get the sticky bar at the bottom instead (StickyBook). */}
          <Button asChild className="hidden md:inline-flex">
            <Link href="/booking">{t("actions.bookTest")}</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
