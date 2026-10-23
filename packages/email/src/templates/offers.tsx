// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import type { Locale } from "@jakamarinko/types";
import { fill, formatDate, messagesFor } from "../i18n";
import { Action, Details, Layout, P } from "../layout";
import type { Template } from "../types";

const intlLocale: Record<Locale, string> = { en: "en-GB", sl: "sl-SI" };

// The site's way to write a price (components/site/site.ts euro()): "90 €", "72,50 €", with a no-break space.
export function formatEuro(cents: number, locale: Locale) {
  return `${new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 2 }).format(cents / 100)}\u00a0€`;
}

export type OfferFreeTestProps = { name: string; code: string; serviceName: string; bookUrl: string; expiresAt?: Date | null };

// "Give a free test": the code, and a book link with it filled in.
export const offerFreeTest: Template<OfferFreeTestProps> = ({ name, code, serviceName, bookUrl, expiresAt }, locale) => {
  const m = messagesFor(locale).offerFreeTest;
  const common = messagesFor(locale).common;
  const rows: [string, string][] = [[m.code, code]];
  if (expiresAt) rows.push([m.validUntil, formatDate(expiresAt, locale)]);
  return {
    subject: fill(m.subject, { service: serviceName }),
    body: (
      <Layout locale={locale} preview={fill(m.preview, { service: serviceName })}>
        <P>{fill(common.greeting, { name })}</P>
        <P>{fill(m.intro, { service: serviceName })}</P>
        <Action href={bookUrl}>{m.book}</Action>
        <Details rows={rows} />
        <P>{m.howTo}</P>
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
  };
};

export type ReferralCreditProps = { name: string; code: string; amountCents: number; bookUrl: string };

// A friend's test through the referral link is done: the referrer's credit.
export const referralCredit: Template<ReferralCreditProps> = ({ name, code, amountCents, bookUrl }, locale) => {
  const m = messagesFor(locale).referralCredit;
  const common = messagesFor(locale).common;
  const amount = formatEuro(amountCents, locale);
  return {
    subject: fill(m.subject, { amount }),
    body: (
      <Layout locale={locale} preview={fill(m.preview, { amount })}>
        <P>{name ? fill(common.greeting, { name }) : common.greetingNoName}</P>
        <P>{fill(m.intro, { amount })}</P>
        <Action href={bookUrl}>{m.book}</Action>
        <Details rows={[[m.code, code]]} />
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
  };
};

export type GiftVoucherProps = { code: string; value: string; voucherUrl: string };

// A gift voucher bought online: the link to the printable voucher.
export const giftVoucher: Template<GiftVoucherProps> = ({ code, value, voucherUrl }, locale) => {
  const m = messagesFor(locale).giftVoucher;
  const common = messagesFor(locale).common;
  return {
    subject: fill(m.subject, { value }),
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{common.greetingNoName}</P>
        <P>{fill(m.intro, { value })}</P>
        <Action href={voucherUrl}>{m.open}</Action>
        <Details rows={[[m.code, code]]} />
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
  };
};
