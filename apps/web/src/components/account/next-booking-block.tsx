import { ArrowRight, CalendarPlus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@jakamarinko/types";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { AddToCalendar, BookingWhenWhere, Preparation, StatusBadge } from "./booking-details";
import { getMyBookings } from "./data";
import { DateTile } from "./date-tile";
import { splitBookings, startsIn } from "./format";
import { OverviewBlock } from "./overview-block";

// Overview block: the next upcoming booking with a countdown, where, how to prepare and add to calendar.
export default async function NextBookingBlock() {
  const t = await getTranslations("account.overview.nextBooking");
  const locale = (await getLocale()) as Locale;
  const now = new Date();
  const next = splitBookings(await getMyBookings(locale), now).upcoming[0];

  if (!next) {
    return (
      <OverviewBlock id="next-booking" title={t("title")} state={{ kind: "empty" }} wide>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
            <CalendarPlus aria-hidden className="size-6" />
          </span>
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="text-lg font-semibold">{t("emptyTitle")}</p>
            <p className="max-w-xl text-pretty text-muted-foreground">{t("emptyBody")}</p>
          </div>
          <Button asChild>
            <Link href="/booking">
              {t("book")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </OverviewBlock>
    );
  }

  return (
    <OverviewBlock
      id="next-booking"
      title={t("title")}
      state={{ kind: "ready" }}
      wide
      action={
        <Link href="/account/bookings" className="-my-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
          {t("manage")}
        </Link>
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <DateTile iso={next.start} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-heading text-2xl font-bold tracking-tight text-balance font-stretch-expanded">{next.serviceName}</p>
              <StatusBadge status={next.status} />
            </div>
            <p className="self-start rounded-md bg-signal px-2 py-1 font-mono text-xs tracking-wide text-signal-foreground">
              {t("startsIn", { relative: startsIn(next.start, now, locale) })}
            </p>
          </div>
          <BookingWhenWhere booking={next} />
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t pt-5">
        <Preparation steps={next.preparation} />
        <div>
          <AddToCalendar id={next.id} />
        </div>
      </div>
    </OverviewBlock>
  );
}
