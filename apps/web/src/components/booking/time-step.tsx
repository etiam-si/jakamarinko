"use client";

import { useQuery } from "@tanstack/react-query";
import type { Service } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FormActions } from "@/components/ui/field";
import { api } from "@/lib/api";
import { Choice } from "./choice";
import { addDays, formatDate, formatDay, formatTime, localDay, slotsByDay } from "./time";
import { Unavailable } from "./unavailable";

export type Picked = { start: string; coachId: string };

export const slotsKey = (service: string) => ["booking", "slots", service];
// The api books up to 60 days ahead; the first two weeks with free times show before "more dates".
const horizonDays = 60;
const firstDays = 14;

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

  return (
    <div className="flex flex-col gap-6">
      <p className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-4 py-3">
        <span className="font-semibold">{service.name}</span>
        <Button type="button" variant="link" className="h-auto p-0" onClick={onChangeService}>
          {t("service.change")}
        </Button>
      </p>
      <p className="text-sm text-muted-foreground">{t("time.timeZone")}</p>

      {slots.isPending && (
        <p role="status" className="flex items-center gap-2 text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {t("time.loading")}
        </p>
      )}
      {slots.isError && <Unavailable />}
      {slots.isSuccess && days.length === 0 && <p role="status">{t("time.empty")}</p>}

      {shownDay && (
        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (picked && pickedFree) onContinue(picked);
            else setError(true);
          }}
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">{t("time.days")}</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(allDays ? days : days.slice(0, firstDays)).map((d) => (
                <Choice key={d} name="day" value={d} checked={d === shownDay} onChange={setDay} className="text-sm">
                  {formatDay(d, locale)}
                </Choice>
              ))}
            </div>
            {!allDays && days.length > firstDays && (
              <Button type="button" variant="outline" className="self-start" onClick={() => setAllDays(true)}>
                {t("time.moreDays")}
              </Button>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-2" aria-describedby={error ? "time-error" : undefined}>
            <legend className="mb-2 font-semibold">{t("time.times", { date: formatDate(times[0]!.start, locale) })}</legend>
            <div className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-6">
              {times.map((s) => (
                <Choice
                  key={s.start}
                  name="time"
                  value={s.start}
                  checked={picked?.start === s.start}
                  onChange={() => {
                    setPicked({ start: s.start, coachId: s.coachId });
                    setError(false);
                  }}
                  className="font-mono"
                >
                  {formatTime(s.start, locale)}
                </Choice>
              ))}
            </div>
          </fieldset>
          {error && (
            <FieldError id="time-error" role="alert">
              {t("time.required")}
            </FieldError>
          )}
          <FormActions>
            <Button type="submit" size="lg">
              {t("continue")}
            </Button>
          </FormActions>
        </form>
      )}
    </div>
  );
}
