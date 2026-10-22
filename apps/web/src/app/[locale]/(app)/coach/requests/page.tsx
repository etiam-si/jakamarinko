import { Inbox } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";

// Empty state until T09 builds the requests inbox.
export default async function RequestsPage() {
  const t = await getTranslations("app.pages.requests");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <EmptyState icon={Inbox} title={t("emptyTitle")} body={t("emptyBody")} />
    </>
  );
}
