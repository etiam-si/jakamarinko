import { Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";

// Empty state until a feature adds settings (calendar sync comes with T16).
export default async function SettingsPage() {
  const t = await getTranslations("app.pages.settings");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <EmptyState icon={Settings} title={t("emptyTitle")} body={t("emptyBody")} />
    </>
  );
}
