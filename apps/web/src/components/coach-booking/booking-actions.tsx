"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CoachBooking } from "@jakamarinko/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiFailure, useCancel, useOutcome, useReschedule, useRescheduleSlots } from "./data";
import { useCustomerName, useWhen } from "./format";
import { useNotice } from "./notice";
import { addDays, localDate, weekStart } from "./time";

const known = ["slot_taken", "not_active", "not_started", "forbidden"] as const;

// The message for a failed action, in the coach's language.
export function useErrorText() {
  const t = useTranslations("coach-booking.errors");
  return (err: unknown) => {
    const code = err instanceof ApiFailure ? err.code : "";
    return (known as readonly string[]).includes(code) ? t(code as (typeof known)[number]) : t("generic");
  };
}

export const isActive = (b: CoachBooking) => b.status === "confirmed" || b.status === "pending_payment";

// Move, cancel and, once it has started, completed or no-show. Nothing for a booking that is over.
export function BookingActions({ booking, now = new Date() }: { booking: CoachBooking; now?: Date }) {
  const t = useTranslations("coach-booking.card");
  const [open, setOpen] = useState<"cancel" | "move">();
  const outcome = useOutcome();
  const notice = useNotice();
  const errorText = useErrorText();
  const tOutcome = useTranslations("coach-booking.outcome");
  if (!isActive(booking)) return null;
  const started = new Date(booking.start) <= now && booking.status === "confirmed";

  function mark(status: "completed" | "no_show") {
    outcome.mutate({ id: booking.id, status }, { onSuccess: () => notice(tOutcome(status)), onError: (e) => notice(errorText(e)) });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {started ? (
        <>
          <Button size="sm" disabled={outcome.isPending} onClick={() => mark("completed")}>
            {t("completed")}
          </Button>
          <Button size="sm" variant="outline" disabled={outcome.isPending} onClick={() => mark("no_show")}>
            {t("noShow")}
          </Button>
        </>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen("move")}>
          {t("move")}
        </Button>
      )}
      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setOpen("cancel")}>
        {t("cancel")}
      </Button>
      {open === "cancel" && <CancelDialog booking={booking} onClose={() => setOpen(undefined)} />}
      {open === "move" && <RescheduleDialog booking={booking} onClose={() => setOpen(undefined)} />}
    </div>
  );
}

function CancelDialog({ booking, onClose }: { booking: CoachBooking; onClose: () => void }) {
  const t = useTranslations("coach-booking.cancel");
  const customerName = useCustomerName();
  const [reason, setReason] = useState("");
  const cancel = useCancel();
  const notice = useNotice();
  const errorText = useErrorText();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    cancel.mutate(
      { id: booking.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          notice(t("done", { name: customerName(booking) }));
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false}>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("body", { name: customerName(booking) })}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cancel-reason">{t("reason")}</Label>
            <Textarea id="cancel-reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} aria-describedby="cancel-reason-hint" />
            <p id="cancel-reason-hint" className="text-sm text-muted-foreground">
              {t("reasonHint")}
            </p>
          </div>
          {cancel.error && <FieldError role="alert">{errorText(cancel.error)}</FieldError>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("back")}
            </Button>
            <Button type="submit" variant="destructive" loading={cancel.isPending}>
              {t("confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// One week of free times at a time, starting with the booking's own week (or this week, if that is past).
function RescheduleDialog({ booking, onClose }: { booking: CoachBooking; onClose: () => void }) {
  const t = useTranslations("coach-booking.reschedule");
  const customerName = useCustomerName();
  const when = useWhen();
  const thisWeek = weekStart(localDate(new Date()));
  const [week, setWeek] = useState(() => {
    const own = weekStart(localDate(new Date(booking.start)));
    return own < thisWeek ? thisWeek : own;
  });
  const [picked, setPicked] = useState<string>();
  const slots = useRescheduleSlots(booking.id, week, addDays(week, 6));
  const reschedule = useReschedule();
  const notice = useNotice();
  const errorText = useErrorText();

  const byDay = new Map<string, string[]>();
  for (const s of slots.data ?? []) {
    if (s.start === booking.start) continue;
    const day = localDate(new Date(s.start));
    byDay.set(day, [...(byDay.get(day) ?? []), s.start]);
  }

  function move(next: number) {
    setWeek(addDays(week, next * 7));
    setPicked(undefined);
  }

  function submit() {
    if (!picked) return;
    reschedule.mutate(
      { id: booking.id, start: picked },
      {
        onSuccess: () => {
          notice(t("done", { name: customerName(booking) }));
          onClose();
        },
        onError: () => {
          setPicked(undefined);
          void slots.refetch();
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body", { name: customerName(booking) })}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <Button size="icon-sm" variant="outline" aria-label={t("previousWeek")} disabled={week <= thisWeek} onClick={() => move(-1)}>
            <ChevronLeft aria-hidden />
          </Button>
          <p className="text-sm font-medium tabular-nums">
            {when.short(week)} – {when.short(addDays(week, 6))}
          </p>
          <Button size="icon-sm" variant="outline" aria-label={t("nextWeek")} onClick={() => move(1)}>
            <ChevronRight aria-hidden />
          </Button>
        </div>
        <div className="-mx-1 overflow-y-auto px-1">
          {slots.isPending ? null : byDay.size === 0 ? (
            <p className="text-muted-foreground">{t("noSlots")}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {[...byDay].map(([day, starts]) => (
                <fieldset key={day} className="flex flex-col gap-2">
                  <legend className="mb-2 text-sm font-semibold">{when.day(day)}</legend>
                  <div className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4">
                    {starts.map((start) => (
                      <Button
                        key={start}
                        size="sm"
                        variant={picked === start ? "default" : "outline"}
                        aria-pressed={picked === start}
                        className="tabular-nums"
                        onClick={() => setPicked(start)}
                      >
                        {when.time(start)}
                      </Button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {reschedule.error && <FieldError role="alert">{errorText(reschedule.error)}</FieldError>}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {t("back")}
            </Button>
            <Button disabled={!picked} loading={reschedule.isPending} onClick={submit}>
              {picked ? t("confirm", { when: when.when(picked) }) : t("pick")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
