// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { fill, formatDate, formatWhen, messagesFor } from "../i18n";
import { Action, Layout, P } from "../layout";
import type { Template } from "../types";
import { type Booking, BookingDetails, bookingIcs } from "./booking";

// booking: with the new time. sequence: higher than any invite sent before for this booking (the first has none).
export type BookingRescheduledProps = { name: string; booking: Booking; previousStart: Date; sequence: number };

export const bookingRescheduled: Template<BookingRescheduledProps> = ({ name, booking, previousStart, sequence }, locale) => {
  const m = messagesFor(locale).bookingRescheduled;
  const common = messagesFor(locale).common;
  return {
    subject: fill(m.subject, { service: booking.serviceName, date: formatDate(booking.start, locale) }),
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{fill(common.greeting, { name })}</P>
        <P>{m.intro}</P>
        <BookingDetails booking={booking} locale={locale} />
        <P>{fill(m.previous, { when: formatWhen(previousStart, locale) })}</P>
        <P>{m.calendar}</P>
        <Action href={booking.manageUrl}>{m.manage}</Action>
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
    attachments: [bookingIcs(booking, sequence)],
  };
};
