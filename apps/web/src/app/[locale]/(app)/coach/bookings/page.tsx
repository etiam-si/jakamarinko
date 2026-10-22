import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { BookingsView } from "@/components/coach-booking/bookings-view";
import { coachParam, type CoachSearch } from "@/components/coach-booking/coach-param";

export default async function CoachBookingsPage({ searchParams }: { searchParams: CoachSearch }) {
  const t = await getTranslations("app.pages.bookings");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <BookingsView coachId={await coachParam(searchParams)} />
    </>
  );
}
