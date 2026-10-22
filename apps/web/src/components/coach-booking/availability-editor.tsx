"use client";

import { useTranslations } from "next-intl";
import { Exceptions } from "./exceptions";
import { NoticeProvider } from "./notice";
import { WeeklyHours } from "./weekly-hours";

export function AvailabilityEditor({ coachId }: { coachId?: string }) {
  const t = useTranslations("coach-booking.availability");
  return (
    <NoticeProvider>
      <section aria-labelledby="weekly-hours" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="weekly-hours" className="text-lg font-semibold">
            {t("weekTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("weekBody")}</p>
        </div>
        <WeeklyHours coachId={coachId} />
      </section>
      <section aria-labelledby="exceptions" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="exceptions" className="text-lg font-semibold">
            {t("exceptionsTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("exceptionsBody")}</p>
        </div>
        <Exceptions coachId={coachId} />
      </section>
    </NoticeProvider>
  );
}
