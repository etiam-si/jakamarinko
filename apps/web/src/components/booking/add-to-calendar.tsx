"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { googleCalendarUrl, icsFile } from "./calendar-file";

type Event = Parameters<typeof icsFile>[0];

export function AddToCalendar({ event }: { event: Event }) {
  const t = useTranslations("booking.confirmed");
  // A blob link for the .ics, made in the browser so the file carries this visit's url.
  const [href, setHref] = useState<string>();
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([icsFile(event)], { type: "text/calendar" }));
    setHref(url);
    return () => URL.revokeObjectURL(url);
  }, [event]);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold">{t("addToCalendar")}</h2>
      <div className="flex flex-wrap gap-3">
        <a href={href} download="booking.ics" className={buttonVariants({ variant: "outline", size: "lg" })}>
          {t("ics")}
        </a>
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline", size: "lg" })}>
          {t("google")}
        </a>
      </div>
    </div>
  );
}
