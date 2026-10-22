import { useTranslations } from "next-intl";
import { BrandPanel } from "@/components/auth/brand-panel";
import { Logo } from "@/components/brand/logo";
import { LanguageMenu } from "@/components/i18n/language-menu";
import { Link } from "@/i18n/navigation";

// Sign-in and consent: the form on one side, the brand panel on the other (lg up). On phones the form comes first
// and the panel follows under it.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common.nav");
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2 lg:gap-3 lg:p-3">
      <main className="flex flex-col px-4 pt-[env(safe-area-inset-top)] sm:px-8 lg:order-2 lg:px-12">
        <div className="flex h-16 items-center gap-2">
          <Link
            href="/"
            aria-label={t("home")}
            className="-ml-1 flex h-11 items-center rounded-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 lg:hidden"
          >
            <Logo className="h-9" />
          </Link>
          <LanguageMenu className="ml-auto" />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 pt-6 pb-10 lg:pb-20">{children}</div>
      </main>
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 lg:order-1 lg:p-0">
        <BrandPanel />
      </div>
    </div>
  );
}
