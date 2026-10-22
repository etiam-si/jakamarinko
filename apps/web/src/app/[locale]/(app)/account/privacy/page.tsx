import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";

// Empty state until T15 builds consents, data export and account deletion.
export default async function PrivacyPage() {
  const t = await getTranslations("app.pages.privacy");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <EmptyState icon={ShieldCheck} title={t("emptyTitle")} body={t("emptyBody")} />
    </>
  );
}
