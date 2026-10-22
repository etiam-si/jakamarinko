import { CalendarClock, CalendarSync, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { coachParam, type CoachSearch } from "@/components/coach-booking/coach-param";
import { Link } from "@/i18n/navigation";

// One entry per setting. Google Calendar is always the coach's own, so it ignores ?coach=.
export default async function SettingsPage({ searchParams }: { searchParams: CoachSearch }) {
  const t = await getTranslations("app.pages.settings");
  const tb = await getTranslations("coach-booking.settings");
  const tc = await getTranslations("calendar");
  const coach = await coachParam(searchParams);
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <Link
        href={{ pathname: "/coach/settings/availability", query: coach ? { coach } : {} }}
        className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-[box-shadow,border-color] hover:border-primary/40 hover:shadow-md md:p-6"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarClock aria-hidden className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-semibold">{tb("availabilityTitle")}</span>
          <span className="text-sm text-pretty text-muted-foreground">{tb("availabilityBody")}</span>
        </span>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
      <Link
        href={{ pathname: "/coach/settings/calendar" }}
        className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted md:p-6"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <CalendarSync aria-hidden className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-semibold">{tc("settingsTitle")}</span>
          <span className="text-sm text-pretty text-muted-foreground">{tc("settingsBody")}</span>
        </span>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </>
  );
}
