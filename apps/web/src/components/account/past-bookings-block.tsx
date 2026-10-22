import { CalendarDays } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@jakamarinko/types";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "./booking-details";
import { getMyBookings } from "./data";
import { formatShortDay, splitBookings } from "./format";
import { OverviewBlock } from "./overview-block";

// Overview block: the last three past or cancelled bookings.
export default async function PastBookingsBlock() {
  const t = await getTranslations("account.overview.pastBookings");
  const locale = (await getLocale()) as Locale;
  const past = splitBookings(await getMyBookings(locale), new Date()).past.slice(0, 3);
  const all = (
    <Link href="/account/bookings" className="text-sm underline underline-offset-4">
      {t("all")}
    </Link>
  );
  return (
    <OverviewBlock id="past-bookings" title={t("title")} state={{ kind: past.length ? "ready" : "empty" }} action={past.length ? all : undefined}>
      {past.length ? (
        <ul className="flex flex-col divide-y">
          {past.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{b.serviceName}</span>
                <span className="text-sm text-muted-foreground">{formatShortDay(b.start, locale)}</span>
              </span>
              <StatusBadge status={b.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays aria-hidden className="size-4" />
          {t("empty")}
        </p>
      )}
    </OverviewBlock>
  );
}
