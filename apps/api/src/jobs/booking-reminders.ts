import { and, eq, gt, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@jakamarinko/db";
import { bookings } from "@jakamarinko/db/schema";
import { findBookings } from "../booking/bookings";
import { bookingConfig } from "../booking/config";
import { sendReminder } from "../booking/emails";
import type { Job } from "../lib/run-jobs";

const day = 24 * 60 * 60_000;

// Reminds every confirmed booking that starts within 24 h. A booking is claimed (reminder_sent_at set) before its
// email goes out, so two runs or two workers never send it twice; a failed send releases it for the next run.
export async function sendReminders(now = new Date()) {
  const due = await db()
    .update(bookings)
    .set({ reminderSentAt: now })
    .where(
      and(
        eq(bookings.status, "confirmed"),
        isNull(bookings.reminderSentAt),
        gt(bookings.startAt, now),
        lte(bookings.startAt, new Date(now.getTime() + day)),
      ),
    )
    .returning({ id: bookings.id });
  if (!due.length) return 0;

  const config = bookingConfig();
  let sent = 0;
  for (const row of await findBookings(inArray(bookings.id, due.map((d) => d.id)))) {
    const result = await sendReminder(row, config);
    if (result.ok) sent++;
    else await db().update(bookings).set({ reminderSentAt: null }).where(eq(bookings.id, row.booking.id));
  }
  return sent;
}

export const bookingReminders: Job = { name: "booking-reminders", everyMs: 5 * 60_000, run: async () => void (await sendReminders()) };
