import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Consent } from "@/components/consent/consent";
import { Providers } from "@/components/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/styles/fonts";
import "../globals.css";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common.meta" });
  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [
        { url: "/brand/icons/favicon.ico", sizes: "16x16 32x32 48x48" },
        { url: "/brand/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/brand/icons/apple-touch-icon.png",
    },
    manifest: "/brand/site.webmanifest",
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontVariables}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <Providers>
            {children}
            <Consent />
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
