import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { AvailabilityEditor } from "@/components/coach-booking/availability-editor";
import { coachParam, type CoachSearch } from "@/components/coach-booking/coach-param";

export default async function AvailabilityPage({ searchParams }: { searchParams: CoachSearch }) {
  const t = await getTranslations("coach-booking.availability");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <AvailabilityEditor coachId={await coachParam(searchParams)} />
    </>
  );
}
