"use client";

import { cn } from "cn";
import { HeartPulse, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CoachBooking } from "@jakamarinko/api";
import { Button } from "@/components/ui/button";
import { StatusBadge as Badge, type StatusTone } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingActions, isActive } from "./booking-actions";
import { useServiceName, useWhen } from "./format";

const minutes = (b: CoachBooking) => (Date.parse(b.end) - Date.parse(b.start)) / 60_000;

// Only the flag: what was answered stays behind "Details".
export function HealthFlag({ booking }: { booking: CoachBooking }) {
  const t = useTranslations("coach-booking.card");
  if (!booking.healthFlag) return null;
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-signal/30 bg-signal/15 px-2.5 text-xs font-semibold text-foreground">
      <HeartPulse aria-hidden className="size-3.5 text-signal" />
      {t("healthFlag")}
    </span>
  );
}

const tones: Record<CoachBooking["status"], StatusTone> = {
  confirmed: "success",
  pending_payment: "warning",
  cancelled: "neutral",
  completed: "success",
  no_show: "error",
};

// Confirmed is the normal case and shows nothing; every other status gets a badge.
export function StatusBadge({ booking }: { booking: CoachBooking }) {
  const t = useTranslations("coach-booking.status");
  if (booking.status === "confirmed") return null;
  return <Badge tone={tones[booking.status]}>{t(booking.status)}</Badge>;
}

// One booking as a card: time, who, what and where, then call, email, details and the actions.
export function BookingCard({ booking, now }: { booking: CoachBooking; now?: Date }) {
  const t = useTranslations("coach-booking.card");
  const when = useWhen();
  const serviceName = useServiceName();
  const [details, setDetails] = useState(false);

  return (
    <article
      aria-label={`${when.time(booking.start)} ${booking.name}`}
      className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm", !isActive(booking) && "opacity-75")}
    >
      <div className="flex gap-4">
        <div className="flex w-12 shrink-0 flex-col font-mono tabular-nums">
          <span className="text-base font-semibold">{when.time(booking.start)}</span>
          <span className="text-xs text-muted-foreground">{when.time(booking.end)}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate font-semibold">{booking.name}</p>
          <p className="text-sm text-muted-foreground">
            {serviceName(booking.service)} · {t("minutes", { minutes: minutes(booking) })}
          </p>
          <p className="truncate text-sm text-muted-foreground">{booking.location.name}</p>
          <div className="flex flex-wrap gap-1.5 empty:hidden">
            <StatusBadge booking={booking} />
            <HealthFlag booking={booking} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" asChild>
          <a href={`tel:${booking.phone.replace(/[^\d+]/g, "")}`}>
            <Phone aria-hidden />
            {t("call")}
          </a>
        </Button>
        <Button size="sm" variant="secondary" asChild>
          <a href={`mailto:${booking.email}`}>
            <Mail aria-hidden />
            {t("email")}
          </a>
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDetails(true)}>
          {t("details")}
        </Button>
      </div>
      <BookingActions booking={booking} now={now} />
      {details && <BookingDetails booking={booking} onClose={() => setDetails(false)} />}
    </article>
  );
}

// Everything about one booking, health answers included when the viewer is the booking's coach.
export function BookingDetails({ booking, onClose }: { booking: CoachBooking; onClose: () => void }) {
  const t = useTranslations("coach-booking.details");
  const when = useWhen();
  const serviceName = useServiceName();
  const rows: [string, React.ReactNode][] = [
    [t("when"), `${when.when(booking.start)}–${when.time(booking.end)}`],
    [t("where"), `${booking.location.name}, ${booking.location.address}`],
    [
      t("contact"),
      <span key="contact" className="flex flex-col">
        <a className="underline underline-offset-4" href={`tel:${booking.phone.replace(/[^\d+]/g, "")}`}>
          {booking.phone}
        </a>
        <a className="break-all underline underline-offset-4" href={`mailto:${booking.email}`}>
          {booking.email}
        </a>
        <span className="text-muted-foreground">{booking.customerUserId ? t("account") : t("guest")}</span>
      </span>,
    ],
  ];
  if (booking.cancelReason) rows.push([t("cancelReason"), booking.cancelReason]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{booking.name}</DialogTitle>
          <DialogDescription>{serviceName(booking.service)}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-1.5 empty:hidden">
          <StatusBadge booking={booking} />
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <HealthAnswers booking={booking} />
        <BookingActions booking={booking} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// The questionnaire as the booking's coach sees it. Anyone else on staff gets the flag and a note.
function HealthAnswers({ booking }: { booking: CoachBooking }) {
  const t = useTranslations("coach-booking.health");
  const answers = booking.healthAnswers && Object.entries(booking.healthAnswers);
  return (
    <section aria-labelledby={`health-${booking.id}`} className="flex flex-col gap-2 rounded-lg bg-muted/60 p-3">
      <h3 id={`health-${booking.id}`} className="flex items-center gap-1.5 font-medium">
        <HeartPulse aria-hidden className={cn("size-4", booking.healthFlag ? "text-signal" : "text-muted-foreground")} />
        {t("title")}
      </h3>
      {booking.healthFlag && <p>{t("flagged")}</p>}
      {!answers ? (
        <p className="text-muted-foreground">{booking.healthFlag ? t("hidden") : t("none")}</p>
      ) : (
        <>
          {!booking.healthFlag && <p className="text-muted-foreground">{t("clear")}</p>}
          <dl className="flex flex-col gap-1.5">
            {answers.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                {/* T11 owns the questions; until it exports their labels, the key is shown as words. */}
                <dt className="first-letter:uppercase">{key.replaceAll("_", " ")}</dt>
                <dd className={cn("text-right", value === true && "font-semibold")}>
                  {value === true ? t("yes") : value === false ? t("no") : value}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
