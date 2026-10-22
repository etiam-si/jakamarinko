import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";

// Empty state until T12 builds bookings and availability.
export default async function CoachBookingsPage() {
  const t = await getTranslations("app.pages.bookings");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <EmptyState icon={CalendarDays} title={t("emptyTitle")} body={t("emptyBody")} />
    </>
  );
}
