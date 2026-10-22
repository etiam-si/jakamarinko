"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BookingCard } from "./booking-card";
import { useBookings } from "./data";
import { useWhen } from "./format";
import { NoticeProvider } from "./notice";
import { QueryState } from "./query-state";
import { addDays, localDate } from "./time";

// Today's and tomorrow's bookings, in order. Cancelled ones are left out: there is nothing to do for them.
export function Today({ coachId }: { coachId?: string }) {
  const t = useTranslations("coach-booking.today");
  const when = useWhen();
  const now = new Date();
  const today = localDate(now);
  const tomorrow = addDays(today, 1);
  const bookings = useBookings(coachId, today, tomorrow);

  if (!bookings.data) return <QueryState query={bookings} />;
  const days = [
    { date: today, label: t("today") },
    { date: tomorrow, label: t("tomorrow") },
  ];

  return (
    <NoticeProvider>
      {days.map(({ date, label }) => {
        const list = bookings.data.filter((b) => b.status !== "cancelled" && localDate(new Date(b.start)) === date);
        return (
          <section key={date} aria-labelledby={`day-${date}`} className="flex flex-col gap-3">
            <h2 id={`day-${date}`} className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl font-semibold">{label}</span>
              <span className="text-sm text-muted-foreground">{when.day(date)}</span>
            </h2>
            {list.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-muted-foreground">{t("empty")}</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((b) => (
                  <BookingCard key={b.id} booking={b} now={now} />
                ))}
              </div>
            )}
          </section>
        );
      })}
      <Link
        href={{ pathname: "/coach/bookings", query: coachId ? { coach: coachId } : {} }}
        className="self-start text-sm font-medium underline underline-offset-4"
      >
        {t("allBookings")}
      </Link>
    </NoticeProvider>
  );
}
