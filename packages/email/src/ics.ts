import { timeZone } from "./i18n";

// sequence: raise it when the same event changes (a reschedule), so calendars update it instead of adding a copy.
type Event = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  location: string;
  description?: string;
  url?: string;
  sequence?: number;
};

// One iCalendar event in Ljubljana local time, with the zone's rules inline (Apple Calendar needs them).
export function icsEvent(event: Event, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//jakamarinko.com//booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...ljubljana,
    "BEGIN:VEVENT",
    `UID:${event.uid}@jakamarinko.com`,
    `DTSTAMP:${utc(now)}`,
    ...(event.sequence ? [`SEQUENCE:${event.sequence}`] : []),
    `DTSTART;TZID=${timeZone}:${local(event.start)}`,
    `DTEND;TZID=${timeZone}:${local(event.end)}`,
    `SUMMARY:${escape(event.summary)}`,
    `LOCATION:${escape(event.location)}`,
    ...(event.description ? [`DESCRIPTION:${escape(event.description)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

const ljubljana = [
  "BEGIN:VTIMEZONE",
  `TZID:${timeZone}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function utc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function local(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
}

function escape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 bytes continue on the next line after a space (RFC 5545 3.1); never splits a character.
function fold(line: string) {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    if (bytes + size > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}
