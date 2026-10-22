// Bookings happen in Slovenia: availability is Ljubljana wall-clock time, the database stores instants (UTC).
export const timeZone = "Europe/Ljubljana";

const format = new Intl.DateTimeFormat("en-GB", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function wallClock(date: Date) {
  const p = Object.fromEntries(format.formatToParts(date).map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!);
}

// Ljubljana's offset from UTC at this instant, in ms (+1 h in winter, +2 h in summer).
const offset = (ms: number) => wallClock(new Date(ms)) - Math.floor(ms / 1000) * 1000;

// The calendar date in Ljubljana at this instant, YYYY-MM-DD.
export function localDate(date: Date) {
  return new Date(wallClock(date)).toISOString().slice(0, 10);
}

// The instant of `minutes` after midnight on a Ljubljana date. A time in the spring-forward gap lands an hour later.
export function zoned(date: string, minutes: number) {
  const wall = Date.parse(`${date}T00:00:00Z`) + minutes * 60_000;
  const guess = wall - offset(wall);
  return new Date(wall - offset(guess));
}

// "16:00" or "16:00:00" (Postgres time) → minutes after midnight.
export function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

export function addDays(date: string, n: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

// 1 = Monday … 7 = Sunday.
export function weekday(date: string) {
  return ((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
}
