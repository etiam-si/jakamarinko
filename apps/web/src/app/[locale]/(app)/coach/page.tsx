import { CalendarCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";

// Empty state until T12 shows the day's bookings.
export default async function TodayPage() {
  const t = await getTranslations("app.pages.today");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <EmptyState icon={CalendarCheck} title={t("emptyTitle")} body={t("emptyBody")} />
    </>
  );
}
