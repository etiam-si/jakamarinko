"use client";

import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { enGB, sl } from "react-day-picker/locale";
import type { AvailabilityException } from "@jakamarinko/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorText } from "./booking-actions";
import { useAddException, useDeleteException, useExceptions } from "./data";
import { useWhen } from "./format";
import { useNotice } from "./notice";
import { QueryState } from "./query-state";
import { addDays, dateOf, localDate, pickerDay } from "./time";

const dayLocales = { en: enGB, sl };

// Every day an exception covers, for marking them in the calendar.
const coveredDays = (list: AvailabilityException[]) =>
  list.flatMap((e) => {
    const days: Date[] = [];
    for (let d = e.startDate; d <= e.endDate && days.length <= 366; d = addDays(d, 1)) days.push(pickerDay(d));
    return days;
  });

// Holidays (closed days) and extra hours, picked on a calendar. An exception can't be edited, only removed and added again.
export function Exceptions({ coachId }: { coachId?: string }) {
  const t = useTranslations("coach-booking.availability");
  const locale = useLocale() as keyof typeof dayLocales;
  const when = useWhen();
  const exceptions = useExceptions(coachId);
  const add = useAddException();
  const remove = useDeleteException();
  const notice = useNotice();
  const errorText = useErrorText();
  const [range, setRange] = useState<DateRange>();
  const [kind, setKind] = useState<"closed" | "open">("closed");
  const [hours, setHours] = useState({ start: "09:00", end: "13:00" });
  const [note, setNote] = useState("");

  if (!exceptions.data) return <QueryState query={exceptions} />;
  const today = localDate(new Date());
  const upcoming = exceptions.data.filter((e) => e.endDate >= today);
  const startDate = range?.from && dateOf(range.from);
  const endDate = range?.to ? dateOf(range.to) : startDate;
  const invalid = !startDate || (kind === "open" && (!hours.start || !hours.end || hours.end <= hours.start));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid || !startDate || !endDate) return;
    const input = { coachId, startDate, endDate, kind, note: note.trim() || null, ...(kind === "open" ? hours : {}) };
    add.mutate(input, {
      onSuccess: () => {
        notice(t("added"));
        setRange(undefined);
        setNote("");
      },
    });
  }

  const closed = coveredDays(exceptions.data.filter((e) => e.kind === "closed"));
  const open = coveredDays(exceptions.data.filter((e) => e.kind === "open"));
  const picked = startDate && endDate && (startDate === endDate ? when.day(startDate) : `${when.short(startDate)} – ${when.short(endDate)}`);

  return (
    <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        <Calendar
          mode="range"
          resetOnSelect
          selected={range}
          onSelect={setRange}
          locale={dayLocales[locale]}
          weekStartsOn={1}
          disabled={{ before: pickerDay(today) }}
          modifiers={{ closed, open }}
          modifiersClassNames={{
            closed: "[&>button]:line-through [&>button]:decoration-destructive [&>button]:decoration-2",
            open: "[&>button]:underline [&>button]:decoration-primary [&>button]:decoration-2 [&>button]:underline-offset-4",
          }}
          className="self-start rounded-lg border [--cell-size:--spacing(10)]"
        />
        <p className="flex gap-4 text-xs text-muted-foreground">
          <span className="line-through decoration-destructive decoration-2">{t("legendClosed")}</span>
          <span className="underline decoration-primary decoration-2 underline-offset-4">{t("legendOpen")}</span>
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg border bg-card p-4">
          <p aria-live="polite" className="font-medium">
            {picked ? `${t("picked")}: ${picked}` : <span className="font-normal text-muted-foreground">{t("pickDays")}</span>}
          </p>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("kind")}</legend>
            {(["closed", "open"] as const).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="size-4 accent-primary" />
                {k === "closed" ? t("kindClosed") : t("kindOpen")}
              </label>
            ))}
          </fieldset>
          {kind === "open" && (
            <div className="flex gap-2">
              {(["start", "end"] as const).map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <Label htmlFor={`exception-${field}`} className="text-xs text-muted-foreground">
                    {field === "start" ? t("from") : t("to")}
                  </Label>
                  <Input
                    id={`exception-${field}`}
                    type="time"
                    step={900}
                    className="w-32"
                    value={hours[field]}
                    onChange={(e) => setHours({ ...hours, [field]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label htmlFor="exception-note" className="text-xs text-muted-foreground">
              {t("note")}
            </Label>
            <Input id="exception-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {add.error && (
            <p role="alert" className="text-sm text-destructive">
              {errorText(add.error)}
            </p>
          )}
          <Button type="submit" className="self-start" disabled={invalid || add.isPending}>
            {t("addException")}
          </Button>
        </form>

        <section aria-labelledby="exceptions-upcoming" className="flex flex-col gap-2">
          <h3 id="exceptions-upcoming" className="text-sm font-medium">
            {t("upcoming")}
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noExceptions")}</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border bg-card">
              {upcoming.map((e) => {
                const days = e.startDate === e.endDate ? when.day(e.startDate) : `${when.short(e.startDate)} – ${when.short(e.endDate)}`;
                const what = e.kind === "closed" ? t("closedRange") : t("openRange", { start: e.start ?? "", end: e.end ?? "" });
                return (
                  <li key={e.id} className="flex items-center gap-3 p-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium">{days}</span>
                      <span className="text-sm text-muted-foreground">
                        {what}
                        {e.note && ` · ${e.note}`}
                      </span>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`${t("remove")}: ${days}`}
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(e.id, { onSuccess: () => notice(t("saved")) })}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
