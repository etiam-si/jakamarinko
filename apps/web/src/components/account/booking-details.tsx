import { CalendarPlus, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { AccountBooking } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { Button } from "@/components/ui/button";
import { calendarUrl, formatDay, formatTime, mapsUrl } from "./format";

// When and where of one booking, with its status. Works in server and client components.
export function BookingWhenWhere({ booking }: { booking: AccountBooking }) {
  const t = useTranslations("account.booking");
  const locale = useLocale() as Locale;
  const { location } = booking;
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">{t("when")}</dt>
        <dd>
          {formatDay(booking.start, locale)}, {formatTime(booking.start, locale)}–{formatTime(booking.end, locale)}
        </dd>
      </div>
      <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">{t("where")}</dt>
        <dd>
          {location.name}, {location.address}{" "}
          <a href={mapsUrl(location.address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
            <MapPin aria-hidden className="size-3.5" />
            {t("map")}
          </a>
        </dd>
      </div>
    </dl>
  );
}

export function StatusBadge({ status }: { status: AccountBooking["status"] }) {
  const t = useTranslations("account.status");
  const tone = status === "confirmed" ? "bg-primary/10 text-primary" : status === "pending_payment" ? "bg-signal/15 text-foreground" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] tracking-wide uppercase ${tone}`}>{t(status)}</span>;
}

export function Preparation({ steps }: { steps: string[] }) {
  const t = useTranslations("account.booking");
  if (!steps.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{t("prepare")}</h3>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-pretty">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
    </div>
  );
}

export function AddToCalendar({ id }: { id: string }) {
  const t = useTranslations("account.booking");
  const locale = useLocale() as Locale;
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={calendarUrl(id, locale)} download>
        <CalendarPlus aria-hidden />
        {t("addToCalendar")}
      </a>
    </Button>
  );
}
