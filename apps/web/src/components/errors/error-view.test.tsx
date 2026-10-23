import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import en from "../../../messages/en/errors.json";
import sl from "../../../messages/sl/errors.json";
import { ErrorView } from "./error-view";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const render = (locale: "en" | "sl") =>
  renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={{ errors: locale === "en" ? en : sl }}>
      <ErrorView reset={() => {}} />
    </NextIntlClientProvider>,
  );

// What error.tsx and global-error.tsx show when a page throws (US-011).
test.each([
  ["en", en],
  ["sl", sl],
] as const)("%s: the error page has a heading, a retry button and a way home", (locale, messages) => {
  const html = render(locale);
  expect(html).toMatch(new RegExp(`<h1[^>]*>${messages.error.title}</h1>`));
  expect(html).toMatch(new RegExp(`<button[^>]*>.*${messages.error.retry}</button>`));
  expect(html).toContain(`<a href="/">${messages.error.home}</a>`);
  expect(html).toContain(messages.error.number);
});
