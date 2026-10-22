import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LanguageMenu } from "@/components/i18n/language-menu";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { headerAccount } from "./account";
import { AccountMenu } from "./account-menu";
import { HeaderBar } from "./header-bar";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

// Logo, the main pages (centred, from lg up), then language, account and "Book a test". Below lg the pages, language
// and account also live in the menu; phones get "Book a test" from the sticky bar at the bottom (StickyBook).
// Who is signed in is read on the server, so the right account entry is there from the first paint.
export async function Header() {
  const t = await getTranslations("common");
  const account = await headerAccount();
  return (
    <HeaderBar>
      <div className="flex shrink-0 lg:flex-1">
        <Link
          href="/"
          aria-label={t("nav.home")}
          className="-ml-1 flex h-11 shrink-0 items-center rounded-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
        >
          <span className="flex origin-left transition-transform duration-300 ease-out group-data-[scrolled=true]/header:scale-[0.92] motion-reduce:transition-none">
            <Logo variant="mark" className="h-9 sm:hidden" />
            <Logo className="hidden h-9 sm:block" />
          </span>
        </Link>
      </div>
      <nav aria-label={t("nav.label")} className="hidden lg:block">
        <NavLinks />
      </nav>
      <div className="ml-auto flex items-center gap-1 lg:ml-0 lg:flex-1 lg:justify-end">
        <div className="hidden md:block">
          <LanguageMenu />
        </div>
        <AccountMenu account={account} />
        <Button asChild className="ml-2 hidden md:inline-flex">
          <Link href="/booking">{t("actions.bookTest")}</Link>
        </Button>
        <MobileMenu account={account} />
      </div>
    </HeaderBar>
  );
}
