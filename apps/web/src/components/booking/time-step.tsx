"use client";

import { useQuery } from "@tanstack/react-query";
import type { Service } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { ArrowRight, CalendarX2, Phone, ShieldCheck, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FormActions } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { Choice } from "./choice";
import { addDays, dayParts, formatDate, formatDay, formatTime, formatWhen, localDay, slotsByDay } from "./time";
import { Unavailable } from "./unavailable";

export type Picked = { start: string; coachId: string };

export const slotsKey = (service: string) => ["booking", "slots", service];
// The api books up to 60 days ahead; the first two weeks with free times show before "more dates".
const horizonDays = 60;
const firstDays = 14;

// Opens on the first day with free times (days without any aren't listed). "Next free" picks the earliest time in
// one tap. Once a time is picked, Continue sticks to the bottom of a phone screen.
export function TimeStep({
  service,
  initial,
  onChangeService,
  onContinue,
}: {
  service: Service;
  initial: Picked | null;
  onChangeService: () => void;
  onContinue: (slot: Picked) => void;
}) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const slots = useQuery({
    queryKey: slotsKey(service.id),
    queryFn: async () => {
      const from = localDay(new Date());
      const res = await api.booking.slots.$get({ query: { service: service.id, from, to: addDays(from, horizonDays) } });
      if (!res.ok) throw new Error(`slots: ${res.status}`);
      return res.json();
    },
  });
  const [picked, setPicked] = useState<Picked | null>(initial);
  const [day, setDay] = useState<string | null>(initial && localDay(new Date(initial.start)));
  const [allDays, setAllDays] = useState(false);
  const [error, setError] = useState(false);

  const byDay = slotsByDay(slots.data ?? []);
  const days = [...byDay.keys()];
  const shownDay = day && byDay.has(day) ? day : days[0];
  const times = shownDay ? byDay.get(shownDay)! : [];
  const pickedFree = picked && times.some((s) => s.start === picked.start);
  const first = days.length ? byDay.get(days[0]!)![0] : undefined;
  const pick = (slot: Picked) => {
    setPicked({ start: slot.start, coachId: slot.coachId });
    setError(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted py-1 pr-1 pl-4">
        <span className="min-w-0 font-semibold text-pretty">{service.name}</span>
        <Button type="button" variant="ghost" className="h-11 shrink-0 px-3 text-primary hover:bg-background/70" onClick={onChangeService}>
          {t("service.change")}
        </Button>
      </div>

      {slots.isPending && (
        <div role="status" aria-label={t("time.loading")} className="flex flex-col gap-3">
          <span className="sr-only">{t("time.loading")}</span>
          <div aria-hidden className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="h-14 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
            ))}
          </div>
        </div>
      )}
      {slots.isError && <Unavailable />}
      {slots.isSuccess && days.length === 0 && <NoTimes />}

      {shownDay && first && (
        <form
          className="flex flex-col gap-7"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (picked && pickedFree) onContinue(picked);
            else setError(true);
          }}
        >
          {picked?.start !== first.start && (
            <button
              type="button"
              onClick={() => {
                setDay(days[0]!);
                pick(first);
              }}
              className="group flex min-h-12 items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/[0.04] px-4 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/[0.07] focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none"
            >
              <Zap aria-hidden className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                {t.rich("time.nextFree", { when: formatWhen(first.start, locale), b: (c) => <strong>{c}</strong> })}
              </span>
              <ArrowRight aria-hidden className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </button>
          )}

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 font-semibold">{t("time.days")}</legend>
            <div className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-5">
              {(allDays ? days : days.slice(0, firstDays)).map((d) => {
                const parts = dayParts(d, locale);
                return (
                  <Choice key={d} name="day" value={d} checked={d === shownDay} onChange={setDay} label={formatDay(d, locale)} className="min-h-14 flex-col gap-0.5 px-2 leading-tight">
                    <span className="font-mono text-xs tracking-wider uppercase opacity-75">{parts.weekday}</span>
                    <span className="font-semibold whitespace-nowrap">{parts.date}</span>
                  </Choice>
                );
              })}
            </div>
            {!allDays && days.length > firstDays && (
              <Button type="button" variant="outline" className="h-11 self-start" onClick={() => setAllDays(true)}>
                {t("time.moreDays")}
              </Button>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-3" aria-describedby={error ? "time-error" : undefined}>
            <legend className="mb-3 font-semibold">{t("time.times", { date: formatDate(times[0]!.start, locale) })}</legend>
            <div className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-6">
              {times.map((s) => (
                <Choice key={s.start} name="time" value={s.start} checked={picked?.start === s.start} onChange={() => pick(s)} className="font-mono tabular-nums">
                  {formatTime(s.start, locale)}
                </Choice>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{t("time.timeZone")}</p>
          </fieldset>

          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <ShieldCheck aria-hidden className="size-4 shrink-0" />
            {t("time.cancellation")}
          </p>

          {error && (
            <FieldError id="time-error" role="alert">
              {t("time.required")}
            </FieldError>
          )}
          {/* On phones, once a time is picked, Continue stays in reach at the bottom of the screen. */}
          <FormActions
            className={
              pickedFree
                ? "max-sm:sticky max-sm:bottom-0 max-sm:z-10 max-sm:-mx-4 max-sm:border-t max-sm:bg-background/90 max-sm:px-4 max-sm:pt-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-sm:backdrop-blur-md"
                : undefined
            }
          >
            <Button type="submit" size="lg">
              {t("continue")}
            </Button>
          </FormActions>
        </form>
      )}
    </div>
  );
}

// No free time in the whole booking window: say so, and offer the phone and a message instead.
function NoTimes() {
  const t = useTranslations("booking.time");
  const contact = useTranslations("contact");
  return (
    <section role="status" className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-card/50 px-5 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
        <CalendarX2 aria-hidden className="size-6" />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-lg font-semibold text-balance">{t("emptyTitle")}</h3>
        <p className="text-pretty text-muted-foreground">{t("empty")}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button asChild size="lg">
          <a href={contact("phone.href")}>
            <Phone aria-hidden />
            {t("call", { phone: contact("phone.value") })}
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/contact">{t("write")}</Link>
        </Button>
      </div>
    </section>
  );
}
