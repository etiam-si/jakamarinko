import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import auth from "../../../messages/en/auth.json";
import { SignInForm } from "./sign-in-form";

vi.mock("@/lib/auth-client", () => ({ authClient: {} }));

const render = (google: boolean) =>
  renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={{ auth }}>
      <SignInForm google={google} />
    </NextIntlClientProvider>,
  );

test("with Google set up, 'Continue with Google' comes first, above the email form", () => {
  const html = render(true);
  expect(html).toContain(auth.signIn.google);
  expect(html.indexOf(auth.signIn.google)).toBeLessThan(html.indexOf("<form"));
});

test("without Google, there is no Google button", () => {
  const html = render(false);
  expect(html).not.toContain(auth.signIn.google);
  expect(html).toContain(auth.signIn.submit);
});
