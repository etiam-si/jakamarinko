// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { fill, formatDate, messagesFor } from "../i18n";
import { Action, Details, Layout, P } from "../layout";
import type { Template } from "../types";
import { type Booking, BookingDetails, bookingIcs } from "./booking";
import { formatEuro } from "./offers";

// priceCents: what the booking costs after a code or discount (offers). retest: a season pack's two retest codes.
export type BookingConfirmationProps = {
  name: string;
  booking: Booking;
  payOnSite: boolean;
  priceCents?: number;
  retest?: { codes: string[]; expiresAt: Date; bookUrl: string };
};

export const bookingConfirmation: Template<BookingConfirmationProps> = ({ name, booking, payOnSite, priceCents, retest }, locale) => {
  const m = messagesFor(locale).bookingConfirmation;
  const o = messagesFor(locale).bookingOffers;
  const common = messagesFor(locale).common;
  const pay =
    priceCents === 0
      ? o.nothingToPay
      : !payOnSite
        ? m.paid
        : priceCents === undefined
          ? m.payOnSite
          : fill(o.payOnSiteAmount, { price: formatEuro(priceCents, locale) });
  return {
    subject: fill(m.subject, { service: booking.serviceName, date: formatDate(booking.start, locale) }),
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{fill(common.greeting, { name })}</P>
        <P>{m.intro}</P>
        <BookingDetails booking={booking} locale={locale} />
        <P>{pay}</P>
        {retest && (
          <>
            <P>{fill(o.retestIntro, { date: formatDate(retest.expiresAt, locale) })}</P>
            <Details rows={retest.codes.map((code, i): [string, string] => [`${i + 1}.`, code])} />
            <Action href={retest.bookUrl}>{o.retestBook}</Action>
          </>
        )}
        <P>{m.prepNote}</P>
        <Action href={booking.manageUrl}>{m.manage}</Action>
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
    attachments: [bookingIcs(booking)],
  };
};
