// Bookings happen in Slovenia: the coach screens show and pick dates in Ljubljana time, wherever the phone is.
export const timeZone = "Europe/Ljubljana";

const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });

// The Ljubljana calendar date of an instant, YYYY-MM-DD.
export const localDate = (date: Date) => dateParts.format(date);

export function addDays(date: string, n: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

// 1 = Monday … 7 = Sunday.
export const weekday = (date: string) => ((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;

// The Monday of the week a date is in.
export const weekStart = (date: string) => addDays(date, 1 - weekday(date));

// A YYYY-MM-DD as a Date at noon UTC, for formatting with timeZone UTC.
export const dayAsDate = (date: string) => new Date(`${date}T12:00:00Z`);

// The date picker works in the browser's zone: a YYYY-MM-DD as that zone's midnight, and back.
export function pickerDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
export const dateOf = (day: Date) =>
  `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
