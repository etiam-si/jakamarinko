import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { pickMessages } from "./pick-messages";

// What every page's client components need: the header, the footer, the cookie banner and the error page.
export const baseClientMessages = ["common", "consent", "errors.error"];

// Client components only see the messages handed to the nearest provider, and a nested provider replaces the
// one above it. So each part of the app wraps its children in one of these with the namespaces (or "ns.key"
// paths) its client components use; everything else stays on the server and out of the page's HTML.
// A client component showing "namespace.key" instead of text needs its namespace added to the nearest one.
export async function ClientMessages({ locale, messages, children }: { locale: string; messages: string[]; children: React.ReactNode }) {
  const all = await getMessages({ locale });
  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(all, [...baseClientMessages, ...messages])}>
      {children}
    </NextIntlClientProvider>
  );
}
