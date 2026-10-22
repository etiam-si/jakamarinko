import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DraftBanner } from "./draft-banner";

const docs = ["privacy", "terms", "cookies"] as const;

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("legal");

  return (
    <>
      <DraftBanner />
      <nav aria-label={t("nav.label")} className="mx-auto flex max-w-3xl gap-4 px-6 pt-8 text-sm">
        {docs.map((doc) => (
          <Link key={doc} href={`/legal/${doc}`} className="underline underline-offset-4">
            {t(`${doc}.title`)}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
