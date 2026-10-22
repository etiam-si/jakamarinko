import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@jakamarinko/types";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { AddToCalendar, BookingWhenWhere, Preparation, StatusBadge } from "./booking-details";
import { getMyBookings } from "./data";
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
        <div className="flex flex-col items-start gap-4">
          <div className="flex flex-col gap-1.5">
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
        <Link href="/account/bookings" className="text-sm underline underline-offset-4">
          {t("manage")}
        </Link>
      }
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded">{next.serviceName}</p>
          <StatusBadge status={next.status} />
        </div>
        <p className="font-mono text-sm text-signal-foreground">
          <span className="rounded bg-signal px-1.5 py-0.5">{t("startsIn", { relative: startsIn(next.start, now, locale) })}</span>
        </p>
      </div>
      <BookingWhenWhere booking={next} />
      <Preparation steps={next.preparation} />
      <div>
        <AddToCalendar id={next.id} />
      </div>
    </OverviewBlock>
  );
}
