import { UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";

// Empty state until T15 builds the profile.
export default async function ProfilePage() {
  const t = await getTranslations("app.pages.profile");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <EmptyState icon={UserRound} title={t("emptyTitle")} body={t("emptyBody")} />
    </>
  );
}
