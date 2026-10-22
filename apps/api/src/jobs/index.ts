import type { Job } from "../lib/run-jobs";
import { paymentExpiry } from "../payments/expire";
import { bookingReminders } from "./booking-reminders";
import { calendarSync } from "./calendar-sync";

// Every background job, one line each: import it from ./<name> and add it here.
export const jobs: Job[] = [
  bookingReminders,
  paymentExpiry,
  calendarSync,
];
