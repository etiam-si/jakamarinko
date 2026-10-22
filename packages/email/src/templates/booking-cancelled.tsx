import { fill, formatDate, messagesFor } from "../i18n";
import { Action, Layout, P } from "../layout";
import type { Template } from "../types";
import { type Booking, BookingDetails } from "./booking";

// TODO(jaka): confirm the refund wording in messages/{en,sl}.json (bookingCancelled.refund, "5 to 10 days").
// refund: the customer paid online and gets the money back (T13 decides when).
export type BookingCancelledProps = { name: string; booking: Booking; reason?: string; refund: boolean; rebookUrl: string };

export const bookingCancelled: Template<BookingCancelledProps> = ({ name, booking, reason, refund, rebookUrl }, locale) => {
  const m = messagesFor(locale).bookingCancelled;
  const common = messagesFor(locale).common;
  return {
    subject: fill(m.subject, { service: booking.serviceName, date: formatDate(booking.start, locale) }),
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{fill(common.greeting, { name })}</P>
        <P>{m.intro}</P>
        <BookingDetails booking={booking} locale={locale} />
        {reason && <P>{fill(m.reason, { reason })}</P>}
        {refund && <P>{m.refund}</P>}
        <Action href={rebookUrl}>{m.rebook}</Action>
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
  };
};
