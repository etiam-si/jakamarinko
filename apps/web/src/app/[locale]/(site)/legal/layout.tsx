import { getTranslations } from "next-intl/server";
import { DraftBanner } from "./draft-banner";
import { LegalNav } from "./legal-nav";

const docs = ["privacy", "terms", "cookies"] as const;

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("legal");

  return (
    <>
      <DraftBanner />
      <LegalNav label={t("nav.label")} docs={docs.map((doc) => ({ href: `/legal/${doc}`, title: t(`${doc}.title`) }))} />
      {children}
    </>
  );
}
