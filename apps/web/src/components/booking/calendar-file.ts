type Event = { id: string; start: string; end: string; title: string; location: string; url: string };

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// "Add to calendar" on the confirmation: a one-event .ics in UTC, which every calendar shows in its own zone.
export function icsFile(e: Event, now = new Date()) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//jakamarinko.com//booking//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@jakamarinko.com`,
    `DTSTAMP:${stamp(now.toISOString())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${escape(e.title)}`,
    `LOCATION:${escape(e.location)}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function googleCalendarUrl(e: Event) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.start)}/${stamp(e.end)}`,
    location: e.location,
    details: e.url,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
