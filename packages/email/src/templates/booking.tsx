// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { Link } from "@react-email/components";
import type { Locale } from "@jakamarinko/types";
import { formatWhen, messagesFor } from "../i18n";
import { Details } from "../layout";

// What every booking email knows about the booking. Times are instants; they are shown in Ljubljana time.
export type Booking = {
  id: string;
  serviceName: string;
  start: Date;
  end: Date;
  location: { name: string; address: string };
  manageUrl: string;
};

export function BookingDetails({ booking, locale }: { booking: Booking; locale: Locale }) {
  const m = messagesFor(locale).common;
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location.address)}`;
  return (
    <Details
      rows={[
        [m.service, booking.serviceName],
        [m.when, formatWhen(booking.start, locale)],
        [
          m.where,
          <>
            {booking.location.name}
            <br />
            {booking.location.address}
            <br />
            <Link href={map} style={{ fontSize: 13 }}>{m.map}</Link>
          </>,
        ],
      ]}
    />
  );
}
