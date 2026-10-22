import type { Job } from "../lib/run-jobs";
import { bookingReminders } from "./booking-reminders";

// Every background job, one line each: import it from ./<name> and add it here.
export const jobs: Job[] = [
  bookingReminders,
];
