import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { use } from "react";
import { BrandPanel } from "@/components/auth/brand-panel";
import { LanguageMenu } from "@/components/i18n/language-menu";
import { ClientMessages } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";

// Sign-in and consent: the form on one side, the brand panel on the other (md up). On phones the form comes first
// and the panel follows under it. A plain way back to the site sits at the top, next to the language.
export default function AuthLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const t = useTranslations("auth");
  return (
    <ClientMessages locale={use(params).locale} messages={["auth"]}>
      <div className="min-h-dvh md:grid md:grid-cols-2 md:gap-3 md:p-3">
        <main className="flex flex-col px-4 pt-[env(safe-area-inset-top)] sm:px-8 md:order-2 md:px-6 lg:px-12">
          <div className="flex h-16 items-center gap-2">
            <Link
              href="/"
              className="-ml-2 flex h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
              <ArrowLeft aria-hidden className="size-4" />
              {t("backToSite")}
            </Link>
            <LanguageMenu className="ml-auto" />
          </div>
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 pt-6 pb-10 md:pb-20">{children}</div>
        </main>
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 md:order-1 md:p-0">
          <BrandPanel />
        </div>
      </div>
    </ClientMessages>
  );
}
