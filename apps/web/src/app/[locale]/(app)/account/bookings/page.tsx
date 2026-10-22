import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";

// Empty state until T15 lists the customer's bookings.
export default async function MyBookingsPage() {
  const t = await getTranslations("app.pages.myBookings");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <EmptyState icon={CalendarDays} title={t("emptyTitle")} body={t("emptyBody")} />
    </>
  );
}
