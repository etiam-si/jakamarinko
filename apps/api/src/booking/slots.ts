import { addDays, minutes, weekday, zoned } from "./time";

// Times are Ljubljana wall-clock ("HH:MM"), dates Ljubljana dates ("YYYY-MM-DD").
export type WeeklyRule = { weekday: number; start: string; end: string; locationId: string };
export type Exception =
  | { kind: "closed"; startDate: string; endDate: string; start: string | null; end: string | null }
  | { kind: "open"; startDate: string; endDate: string; start: string; end: string; locationId: string };
export type Interval = { start: Date; end: Date };
export type Slot = Interval & { locationId: string };

export type SlotInput = {
  from: string;
  to: string;
  now: Date;
  rules: WeeklyRule[];
  exceptions: Exception[];
  // Bookings that hold time: nothing may start within bufferMin of them.
  busy: Interval[];
  durationMin: number;
  bufferMin: number;
  noticeMin: number;
  horizonDays: number;
  // Slots start every stepMin from the start of each window.
  stepMin: number;
};

const minute = 60_000;
const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

// Free slots between the dates from and to (both included), sorted by start.
export function freeSlots(input: SlotInput): Slot[] {
  const { now, durationMin, bufferMin, stepMin } = input;
  const earliest = now.getTime() + input.noticeMin * minute;
  const latest = now.getTime() + input.horizonDays * 1440 * minute;
  const padded = input.busy.map((b) => ({
    start: new Date(b.start.getTime() - bufferMin * minute),
    end: new Date(b.end.getTime() + bufferMin * minute),
  }));
  const slots = new Map<number, Slot>();

  for (let date = input.from; date <= input.to; date = addDays(date, 1)) {
    const on = input.exceptions.filter((e) => e.startDate <= date && date <= e.endDate);
    const closed = on.filter((e) => e.kind === "closed");
    if (closed.some((e) => !e.start)) continue;
    const blocked = closed.map((e) => span(date, e.start!, e.end!));

    const windows = [
      ...input.rules.filter((r) => r.weekday === weekday(date)),
      ...on.filter((e) => e.kind === "open"),
    ].map((w) => ({ ...span(date, w.start, w.end), locationId: w.locationId }));

    for (const w of windows) {
      for (let t = w.start.getTime(); t + durationMin * minute <= w.end.getTime(); t += stepMin * minute) {
        const slot = { start: new Date(t), end: new Date(t + durationMin * minute), locationId: w.locationId };
        if (t < earliest || t > latest || slots.has(t)) continue;
        if (blocked.some((b) => overlaps(slot, b)) || padded.some((b) => overlaps(slot, b))) continue;
        slots.set(t, slot);
      }
    }
  }
  return [...slots.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
}

const span = (date: string, start: string, end: string): Interval => ({
  start: zoned(date, minutes(start)),
  end: zoned(date, minutes(end)),
});
