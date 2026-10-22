import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { coachParam, type CoachSearch } from "@/components/coach-booking/coach-param";
import { Today } from "@/components/coach-booking/today";

// Today and tomorrow, for the calendar picked in the switcher (?coach=) or the signed-in coach's own.
export default async function TodayPage({ searchParams }: { searchParams: CoachSearch }) {
  const t = await getTranslations("app.pages.today");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <Today coachId={await coachParam(searchParams)} />
    </>
  );
}
