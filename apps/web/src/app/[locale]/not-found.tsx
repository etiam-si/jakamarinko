import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { NotFoundView } from "@/components/errors/not-found-view";
import { Link } from "@/i18n/navigation";

// 404 outside the site's pages (an unknown landing page, an old link into the app): the mark, then the same page.
// Every page's payload carries this boundary, so it uses the small mark instead of the full logo.
export default function NotFound() {
  const t = useTranslations("common.nav");
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8">
        <Link href="/" aria-label={t("home")} className="inline-flex rounded-sm">
          <Logo variant="mark" className="h-10" />
        </Link>
      </div>
      <NotFoundView />
    </main>
  );
}
