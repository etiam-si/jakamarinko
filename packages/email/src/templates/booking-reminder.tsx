// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { fill, formatTime, messagesFor } from "../i18n";
import { Action, Layout, P } from "../layout";
import type { Template } from "../types";
import { type Booking, BookingDetails } from "./booking";

export type BookingReminderProps = { name: string; booking: Booking };

export const bookingReminder: Template<BookingReminderProps> = ({ name, booking }, locale) => {
  const m = messagesFor(locale).bookingReminder;
  const common = messagesFor(locale).common;
  return {
    subject: fill(m.subject, { service: booking.serviceName, time: formatTime(booking.start, locale) }),
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{fill(common.greeting, { name })}</P>
        <P>{m.intro}</P>
        <BookingDetails booking={booking} locale={locale} />
        <Action href={booking.manageUrl}>{m.reschedule}</Action>
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
  };
};
