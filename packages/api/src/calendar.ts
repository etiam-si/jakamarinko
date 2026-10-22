import { z } from "zod";
import { locales } from "@jakamarinko/types";

// GET /api/calendar (coach): the signed-in coach's Google Calendar connection.
// available: false when the server has no Google keys; the feature is off.
export const CalendarStatus = z.object({
  available: z.boolean(),
  connection: z
    .object({
      status: z.enum(["connected", "needs_reconnect"]),
      account: z.string(),
      calendarId: z.string(),
      calendarName: z.string().nullable(),
      syncedAt: z.iso.datetime({ offset: true }).nullable(),
    })
    .nullable(),
});
export type CalendarStatus = z.infer<typeof CalendarStatus>;

// POST /api/calendar/google/connect: where the browser goes to let us in. locale: the page to come back to.
export const ConnectCalendarInput = z.object({ locale: z.enum(locales) });
export const ConnectCalendar = z.object({ url: z.url() });

// GET /api/calendar/calendars: calendars the coach may write to.
export const CalendarChoice = z.object({ id: z.string(), name: z.string(), primary: z.boolean() });
export type CalendarChoice = z.infer<typeof CalendarChoice>;

// PUT /api/calendar: which calendar receives new bookings.
export const UpdateCalendarInput = z.object({ calendarId: z.string().min(1).max(1024) });
export type UpdateCalendarInput = z.infer<typeof UpdateCalendarInput>;

// The settings page's ?result= after Google sends the coach back.
export const ConnectResult = z.enum(["connected", "denied", "scope", "failed"]);
export type ConnectResult = z.infer<typeof ConnectResult>;
