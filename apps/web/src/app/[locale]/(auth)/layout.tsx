import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";

// Sign-in and consent: the logo, then one card in the middle of the page.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common.nav");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" aria-label={t("home")} className="rounded-sm">
        <Logo className="h-10" />
      </Link>
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
    </main>
  );
}
