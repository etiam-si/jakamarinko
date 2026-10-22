import { CalendarClock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { BookingsView } from "@/components/coach-booking/bookings-view";
import { coachParam, type CoachSearch } from "@/components/coach-booking/coach-param";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function CoachBookingsPage({ searchParams }: { searchParams: CoachSearch }) {
  const t = await getTranslations("app.pages.bookings");
  const tb = await getTranslations("coach-booking.settings");
  const coach = await coachParam(searchParams);
  return (
    <>
      <PageHeader
        title={t("title")}
        lead={t("lead")}
        action={
          <Button asChild variant="outline">
            <Link href={{ pathname: "/coach/settings/availability", query: coach ? { coach } : {} }}>
              <CalendarClock aria-hidden />
              {tb("open")}
            </Link>
          </Button>
        }
      />
      <BookingsView coachId={coach} />
    </>
  );
}
