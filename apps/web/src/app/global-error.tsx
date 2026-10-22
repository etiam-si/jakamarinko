"use client";

import { usePathname } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { ErrorView } from "@/components/errors/error-view";
import { fontVariables } from "@/styles/fonts";
import en from "../../messages/en/errors.json";
import sl from "../../messages/sl/errors.json";
import "./globals.css";

// When even the root layout fails, nothing above is left to give the language or the messages: the path says the
// language, and the error texts come with this file.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const locale = usePathname()?.startsWith("/sl") ? "sl" : "en";
  return (
    <html lang={locale} className={fontVariables}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider locale={locale} messages={{ errors: locale === "sl" ? sl : en }}>
          <main className="flex min-h-dvh items-center">
            <ErrorView reset={reset} />
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
