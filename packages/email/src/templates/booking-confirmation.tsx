// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { fill, formatDate, messagesFor } from "../i18n";
import { Action, Layout, P } from "../layout";
import type { Template } from "../types";
import { type Booking, BookingDetails, bookingIcs } from "./booking";

export type BookingConfirmationProps = { name: string; booking: Booking; payOnSite: boolean };

export const bookingConfirmation: Template<BookingConfirmationProps> = ({ name, booking, payOnSite }, locale) => {
  const m = messagesFor(locale).bookingConfirmation;
  const common = messagesFor(locale).common;
  return {
    subject: fill(m.subject, { service: booking.serviceName, date: formatDate(booking.start, locale) }),
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{fill(common.greeting, { name })}</P>
        <P>{m.intro}</P>
        <BookingDetails booking={booking} locale={locale} />
        <P>{payOnSite ? m.payOnSite : m.paid}</P>
        <P>{m.prepNote}</P>
        <Action href={booking.manageUrl}>{m.manage}</Action>
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
    attachments: [bookingIcs(booking)],
  };
};
