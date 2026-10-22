import { cn } from "cn";
import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { AccountBooking } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { AddToCalendar, BookingWhenWhere, Preparation, StatusBadge } from "@/components/account/booking-details";
import { CancelBooking } from "@/components/account/cancel-booking";
import { getMyBookings } from "@/components/account/data";
import { DateTile } from "@/components/account/date-tile";
import { splitBookings } from "@/components/account/format";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

function BookingItem({ booking, upcoming }: { booking: AccountBooking; upcoming: boolean }) {
  return (
    <li
      className={cn("flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5", !upcoming && "bg-card/60 shadow-none")}
      data-booking={booking.id}
    >
      <div className="flex items-start gap-4">
        <DateTile iso={booking.start} muted={!upcoming} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-balance">{booking.serviceName}</h3>
            <StatusBadge status={booking.status} />
          </div>
          <BookingWhenWhere booking={booking} />
        </div>
      </div>
      {upcoming && (
        <div className="flex flex-col gap-4 border-t pt-4">
          <Preparation steps={booking.preparation} />
          <div className="flex flex-wrap items-center gap-2">
            <AddToCalendar id={booking.id} />
            <CancelBooking booking={booking} />
          </div>
        </div>
      )}
    </li>
  );
}

// The customer's bookings: upcoming ones to prepare for, cancel or add to a calendar, then the rest.
export default async function MyBookingsPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations("app.pages.myBookings");
  const tb = await getTranslations("account.bookings");
  const bookings = await getMyBookings(locale);
  const { upcoming, past } = splitBookings(bookings, new Date());

  if (!bookings.length) {
    return (
      <>
        <PageHeader title={t("title")} lead={t("lead")} />
        <EmptyState icon={CalendarDays} title={t("emptyTitle")} body={t("emptyBody")}>
          <Button asChild className="max-md:h-11">
            <Link href="/booking">{tb("book")}</Link>
          </Button>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        lead={t("lead")}
        action={
          <Button asChild className="max-md:h-11">
            <Link href="/booking">{tb("book")}</Link>
          </Button>
        }
      />
      <section aria-labelledby="upcoming" className="flex flex-col gap-3">
        <h2 id="upcoming" className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {tb("upcoming")}
        </h2>
        {upcoming.length ? (
          <ul className="flex flex-col gap-3">
            {upcoming.map((b) => (
              <BookingItem key={b.id} booking={b} upcoming />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{tb("noUpcoming")}</p>
        )}
      </section>
      <section aria-labelledby="past" className="flex flex-col gap-3">
        <h2 id="past" className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {tb("past")}
        </h2>
        {past.length ? (
          <ul className="flex flex-col gap-3">
            {past.map((b) => (
              <BookingItem key={b.id} booking={b} upcoming={false} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{tb("noPast")}</p>
        )}
      </section>
    </>
  );
}
