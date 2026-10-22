"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Availability, Location } from "@jakamarinko/api";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useErrorText } from "./booking-actions";
import { useAvailability, useDeleteAvailability, useLocations, useSaveAvailability } from "./data";
import { useNotice } from "./notice";
import { QueryState } from "./query-state";

const weekdays = [1, 2, 3, 4, 5, 6, 7] as const;
type Draft = { key: string; id?: string; weekday: number; start: string; end: string; locationId: string };

const toDraft = (a: Availability): Draft => ({ key: a.id, ...a });

// The weekly template: per weekday any number of time ranges, each at a location. Every range saves on its own.
export function WeeklyHours({ coachId }: { coachId?: string }) {
  const t = useTranslations("coach-booking");
  const availability = useAvailability(coachId);
  const locations = useLocations();
  const [drafts, setDrafts] = useState<Draft[]>([]);

  if (!availability.data || !locations.data) return <QueryState query={availability.data ? locations : availability} />;
  const fallback = locations.data.find((l) => l.isDefault) ?? locations.data[0];

  function add(weekday: number) {
    const key = `new-${Date.now()}`;
    setDrafts((d) => [...d, { key, weekday, start: "16:00", end: "20:00", locationId: fallback?.id ?? "" }]);
  }
  const drop = (key: string) => setDrafts((d) => d.filter((x) => x.key !== key));

  return (
    <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
      {weekdays.map((weekday) => {
        const saved = availability.data.filter((a) => a.weekday === weekday).map(toDraft);
        const rows = [...saved, ...drafts.filter((d) => d.weekday === weekday)];
        const name = t(`weekdays.${weekday}`);
        return (
          <section key={weekday} aria-label={name} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:gap-6">
            <h3 className="w-28 shrink-0 pt-2 font-semibold">{name}</h3>
            <div className="flex flex-1 flex-col gap-3">
              {rows.length === 0 && <p className="pt-2 text-sm text-muted-foreground">{t("availability.closed")}</p>}
              {rows.map((row) => (
                <HoursRow key={row.key} row={row} day={name} coachId={coachId} locations={locations.data} onDone={() => drop(row.key)} />
              ))}
              <Button size="sm" variant="outline" className="self-start" onClick={() => add(weekday)} disabled={!fallback}>
                <Plus aria-hidden />
                {t("availability.add")}
              </Button>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// onDone: a new row was saved or dropped, so the draft goes (the saved row comes back from the api).
type RowProps = { row: Draft; day: string; coachId?: string; locations: Location[]; onDone: () => void };

function HoursRow({ row, day, coachId, locations, onDone }: RowProps) {
  const t = useTranslations("coach-booking.availability");
  const [value, setValue] = useState(row);
  const save = useSaveAvailability();
  const remove = useDeleteAvailability();
  const notice = useNotice();
  const errorText = useErrorText();
  const dirty = !row.id || value.start !== row.start || value.end !== row.end || value.locationId !== row.locationId;
  const invalid = !value.start || !value.end || value.end <= value.start;
  const id = `hours-${row.key}`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    const { id: rowId, weekday, start, end, locationId } = value;
    save.mutate(
      { id: rowId, coachId, weekday, start, end, locationId },
      {
        onSuccess: () => {
          notice(t("saved"));
          if (!rowId) onDone();
        },
      },
    );
  }

  function del() {
    if (!row.id) return onDone();
    remove.mutate(row.id, { onSuccess: () => notice(t("saved")) });
  }

  const error = save.error ?? remove.error;
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2" aria-label={`${day} ${value.start}–${value.end}`}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-start`} className="text-xs text-muted-foreground">
          {t("from")}
        </Label>
        <Input
          id={`${id}-start`}
          type="time"
          step={900}
          className="w-32"
          value={value.start}
          onChange={(e) => setValue({ ...value, start: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-end`} className="text-xs text-muted-foreground">
          {t("to")}
        </Label>
        <Input
          id={`${id}-end`}
          type="time"
          step={900}
          className="w-32"
          aria-invalid={invalid}
          value={value.end}
          onChange={(e) => setValue({ ...value, end: e.target.value })}
        />
      </div>
      {locations.length > 1 && (
        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <Label htmlFor={`${id}-location`} className="text-xs text-muted-foreground">
            {t("location")}
          </Label>
          <Select value={value.locationId} onValueChange={(locationId) => setValue({ ...value, locationId })}>
            <SelectTrigger id={`${id}-location`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-1">
        {dirty && (
          <Button type="submit" size="icon" className="w-auto px-4" disabled={invalid} loading={save.isPending}>
            {t("save")}
          </Button>
        )}
        <Button type="button" size="icon" variant="ghost" aria-label={t("remove")} disabled={remove.isPending} onClick={del}>
          <Trash2 aria-hidden />
        </Button>
      </div>
      {error && (
        <FieldError role="alert" className="basis-full">
          {errorText(error)}
        </FieldError>
      )}
    </form>
  );
}
