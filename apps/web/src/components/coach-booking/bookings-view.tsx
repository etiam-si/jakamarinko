"use client";

import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CoachBooking } from "@jakamarinko/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isActive } from "./booking-actions";
import { BookingCard, BookingDetails, HealthFlag, StatusBadge } from "./booking-card";
import { useBookings } from "./data";
import { services, useServiceName, useWhen } from "./format";
import { NoticeProvider } from "./notice";
import { QueryState } from "./query-state";
import { addDays, localDate, weekStart } from "./time";

const statuses = ["active", "all", "cancelled", "completed", "no_show"] as const;
type StatusFilter = (typeof statuses)[number];

const matches = (b: CoachBooking, status: StatusFilter, service: string) =>
  (status === "all" || (status === "active" ? isActive(b) : b.status === status)) && (service === "all" || b.service === service);

// Bookings by week (a column per day from md up, days under each other on a phone) or as a list.
export function BookingsView({ coachId }: { coachId?: string }) {
  const t = useTranslations("coach-booking.bookings");
  const tStatus = useTranslations("coach-booking.status");
  const serviceName = useServiceName();
  const today = localDate(new Date());
  const [view, setView] = useState<"week" | "list">("week");
  const [week, setWeek] = useState(() => weekStart(today));
  const [period, setPeriod] = useState<"upcoming" | "past">("upcoming");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [service, setService] = useState("all");

  const [from, to] =
    view === "week" ? [week, addDays(week, 6)] : period === "upcoming" ? [today, addDays(today, 90)] : [addDays(today, -90), addDays(today, -1)];
  const bookings = useBookings(coachId, from, to);
  const shown = (bookings.data ?? []).filter((b) => matches(b, status, service));
  if (period === "past" && view === "list") shown.reverse();

  return (
    <NoticeProvider>
      <div className="flex flex-col gap-4">
        <div role="group" aria-label={t("view")} className="inline-flex self-start rounded-md border p-0.5">
          {(["week", "list"] as const).map((v) => (
            <Button key={v} size="sm" variant={view === v ? "secondary" : "ghost"} aria-pressed={view === v} onClick={() => setView(v)}>
              {t(v)}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <Filter id="status" label={t("status")} value={status} onChange={(v) => setStatus(v as StatusFilter)}>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? t("all") : s === "active" ? t("active") : tStatus(s)}
              </SelectItem>
            ))}
          </Filter>
          <Filter id="service" label={t("service")} value={service} onChange={setService}>
            <SelectItem value="all">{t("all")}</SelectItem>
            {services.map((s) => (
              <SelectItem key={s} value={s}>
                {serviceName(s)}
              </SelectItem>
            ))}
          </Filter>
          {view === "list" && (
            <Filter id="period" label={t("period")} value={period} onChange={(v) => setPeriod(v as "upcoming" | "past")}>
              <SelectItem value="upcoming">{t("upcoming")}</SelectItem>
              <SelectItem value="past">{t("past")}</SelectItem>
            </Filter>
          )}
        </div>
        {view === "week" && <WeekNav week={week} onChange={setWeek} today={today} />}
      </div>

      {!bookings.data ? (
        <QueryState query={bookings} />
      ) : view === "week" ? (
        <Week week={week} today={today} bookings={shown} />
      ) : (
        <section aria-label={t("list")} className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("count", { count: shown.length })}</p>
          {shown.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-muted-foreground">{t("empty")}</p>
          ) : (
            <ListByDay bookings={shown} />
          )}
        </section>
      )}
    </NoticeProvider>
  );
}

function Filter({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:w-52">
      <Label htmlFor={`filter-${id}`} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={`filter-${id}`} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function WeekNav({ week, today, onChange }: { week: string; today: string; onChange: (week: string) => void }) {
  const t = useTranslations("coach-booking.bookings");
  const when = useWhen();
  return (
    <div className="flex items-center gap-2">
      <Button size="icon-sm" variant="outline" aria-label={t("previousWeek")} onClick={() => onChange(addDays(week, -7))}>
        <ChevronLeft aria-hidden />
      </Button>
      <p className="min-w-0 flex-1 text-center font-medium tabular-nums sm:flex-none" aria-live="polite">
        {when.short(week)} – {when.short(addDays(week, 6))}
      </p>
      <Button size="icon-sm" variant="outline" aria-label={t("nextWeek")} onClick={() => onChange(addDays(week, 7))}>
        <ChevronRight aria-hidden />
      </Button>
      {week !== weekStart(today) && (
        <Button size="sm" variant="ghost" onClick={() => onChange(weekStart(today))}>
          {t("thisWeek")}
        </Button>
      )}
    </div>
  );
}

const groupByDay = (bookings: CoachBooking[]) => {
  const days = new Map<string, CoachBooking[]>();
  for (const b of bookings) {
    const day = localDate(new Date(b.start));
    days.set(day, [...(days.get(day) ?? []), b]);
  }
  return days;
};

function ListByDay({ bookings }: { bookings: CoachBooking[] }) {
  const when = useWhen();
  const now = new Date();
  return [...groupByDay(bookings)].map(([day, list]) => (
    <section key={day} aria-label={when.day(day)} className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{when.day(day)}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((b) => (
          <BookingCard key={b.id} booking={b} now={now} />
        ))}
      </div>
    </section>
  ));
}

// Seven days. Each booking is a compact row that opens its details (with the actions).
function Week({ week, today, bookings }: { week: string; today: string; bookings: CoachBooking[] }) {
  const t = useTranslations("coach-booking");
  const when = useWhen();
  const byDay = groupByDay(bookings);
  const [open, setOpen] = useState<CoachBooking>();
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));

  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((day) => {
        const list = byDay.get(day) ?? [];
        return (
          <section
            key={day}
            aria-label={when.day(day)}
            className={cn("flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-2", day === today && "border-primary")}
          >
            <h2 className={cn("px-1 text-sm font-medium", day === today ? "text-primary" : "text-muted-foreground")}>{when.short(day)}</h2>
            {list.length === 0 ? (
              <p className="px-1 pb-1 text-xs text-muted-foreground md:sr-only">{t("today.empty")}</p>
            ) : (
              list.map((b) => <WeekItem key={b.id} booking={b} onOpen={() => setOpen(b)} />)
            )}
          </section>
        );
      })}
      {open && <BookingDetails booking={bookings.find((b) => b.id === open.id) ?? open} onClose={() => setOpen(undefined)} />}
    </div>
  );
}

function WeekItem({ booking, onOpen }: { booking: CoachBooking; onOpen: () => void }) {
  const when = useWhen();
  const serviceName = useServiceName();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex flex-col items-start gap-1 rounded-md bg-secondary/70 p-2 text-left text-sm transition-colors hover:bg-secondary",
        !isActive(booking) && "opacity-60",
      )}
    >
      <span className="font-mono text-xs font-semibold tabular-nums">{when.time(booking.start)}</span>
      <span className="w-full truncate font-medium">{booking.name}</span>
      <span className="w-full truncate text-xs text-muted-foreground">{serviceName(booking.service)}</span>
      <span className="flex flex-wrap gap-1 empty:hidden">
        <StatusBadge booking={booking} />
        <HealthFlag booking={booking} />
      </span>
    </button>
  );
}
