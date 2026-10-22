import { sendEmail, type Booking as EmailBooking } from "@jakamarinko/email";
import { catalogItem, needsFasting, serviceName } from "./catalog";
import type { BookingConfig } from "./config";
import { manageUrl, type BookingRow } from "./bookings";
import { seasonRetest } from "../offers/rewards";

function emailBooking(row: BookingRow, config: BookingConfig): EmailBooking {
  const b = row.booking;
  return {
    id: b.id,
    serviceName: serviceName(row.service, b.locale),
    start: b.startAt,
    end: b.endAt,
    location: { name: row.location.name, address: row.location.address },
    manageUrl: manageUrl(b, config),
  };
}

const to = (row: BookingRow) => ({ to: row.booking.customerEmail, locale: row.booking.locale });
const name = (row: BookingRow) => row.booking.customerName;

// On confirm: the confirmation (with .ics) and, for lab tests, how to prepare. Until T13 every booking is paid on site.
export async function sendConfirmed(row: BookingRow, config: BookingConfig) {
  const booking = emailBooking(row, config);
  const payOnSite = row.booking.paidVia === "none";
  const priceCents = row.paidCents ?? row.listCents;
  const retest = await seasonRetest(row, config);
  const props = { name: name(row), booking, payOnSite, priceCents, retest };
  const results = [await sendEmail({ ...to(row), template: "bookingConfirmation", props })];
  if (catalogItem(row.service).kind === "lab_test") {
    const fasted = needsFasting(row.service);
    results.push(await sendEmail({ ...to(row), template: "bookingPreparation", props: { name: name(row), booking, fasted } }));
  }
  return results;
}

export function sendReminder(row: BookingRow, config: BookingConfig) {
  return sendEmail({ ...to(row), template: "bookingReminder", props: { name: name(row), booking: emailBooking(row, config) } });
}

export function sendCancelled(row: BookingRow, config: BookingConfig, reason?: string) {
  const rebookUrl = `${config.siteUrl}/${row.booking.locale}/booking?service=${row.service}`;
  // Online refunds come with T13; a booking paid on site has nothing to refund.
  const props = { name: name(row), booking: emailBooking(row, config), reason, refund: row.booking.paidVia === "stripe", rebookUrl };
  return sendEmail({ ...to(row), template: "bookingCancelled", props });
}

// A coach moved the booking. The .ics keeps the booking's UID; seconds since 1970 always beat the last sequence sent.
export function sendRescheduled(row: BookingRow, previousStart: Date, now: Date, config: BookingConfig) {
  const props = { name: name(row), booking: emailBooking(row, config), previousStart, sequence: Math.floor(now.getTime() / 1000) };
  return sendEmail({ ...to(row), template: "bookingRescheduled", props });
}
