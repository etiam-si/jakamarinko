import { syncCalendars } from "../calendar/sync";
import type { Job } from "../lib/run-jobs";

// Google Calendar (T16): busy times read every 5 minutes, and bookings whose push failed are pushed again.
export const calendarSync: Job = { name: "calendar-sync", everyMs: 5 * 60_000, run: async () => void (await syncCalendars()) };
