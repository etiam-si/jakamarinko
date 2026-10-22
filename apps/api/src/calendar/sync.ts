import { eq } from "drizzle-orm";
import { db } from "@jakamarinko/db";
import { calendarConnections } from "@jakamarinko/db/schema";
import { loggable } from "../lib/errors";
import { refreshBusy } from "./busy";
import { calendarConfig } from "./config";
import { GoogleError } from "./google";
import { syncBooking, unsyncedBookings } from "./push";

const reason = (err: unknown) => (err instanceof GoogleError ? err.message : loggable(err));

// One pass over every working connection: busy times read again, then every booking whose event is missing,
// moved or cancelled is pushed. A failure is logged and left for the next pass; it never stops the others.
export async function syncCalendars(now = new Date()) {
  const config = calendarConfig();
  if (!config) return { coaches: 0, bookings: 0 };
  const connections = await db().select().from(calendarConnections).where(eq(calendarConnections.status, "connected"));
  for (const conn of connections) {
    await refreshBusy(config, conn, now).catch((err: unknown) => console.error(`calendar busy times not read: ${reason(err)}`));
  }
  let pushed = 0;
  for (const id of await unsyncedBookings(now)) {
    await syncBooking(id).then(
      () => pushed++,
      (err: unknown) => console.error(`calendar sync of booking ${id} failed: ${reason(err)}`),
    );
  }
  return { coaches: connections.length, bookings: pushed };
}
