import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { coachParam, type CoachSearch } from "@/components/coach-booking/coach-param";
import { Today } from "@/components/coach-booking/today";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// Today and tomorrow, for the calendar picked in the switcher (?coach=) or the signed-in coach's own.
export default async function TodayPage({ searchParams }: { searchParams: CoachSearch }) {
  const t = await getTranslations("app.pages.today");
  const tb = await getTranslations("coach-booking.today");
  const coach = await coachParam(searchParams);
  return (
    <>
      <PageHeader
        title={t("title")}
        lead={t("lead")}
        action={
          <Button asChild variant="outline">
            <Link href={{ pathname: "/coach/bookings", query: coach ? { coach } : {} }}>{tb("allBookings")}</Link>
          </Button>
        }
      />
      <Today coachId={coach} />
    </>
  );
}
