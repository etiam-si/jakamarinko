import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BRAND_NAME } from "@/components/brand/logo";
import { Consent } from "@/components/consent/consent";
import { Providers } from "@/components/providers/providers";
import { siteUrl, socialMetadata } from "@/components/site/site";
import { ClientMessages } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/styles/fonts";
import "../globals.css";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Defaults for every page; pages set their own title, description and link preview (pageMetadata in site.ts).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common.meta" });
  const meta = { title: t("title"), description: t("description") };
  return {
    metadataBase: new URL(siteUrl),
    ...meta,
    applicationName: BRAND_NAME,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
        { url: "/brand/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-touch-icon.png",
    },
    manifest: "/brand/site.webmanifest",
    ...socialMetadata(locale, "", meta),
  };
}

// The browser bar matches the page background (theme.css --background).
export const viewport: Viewport = { themeColor: "#f4f6f5" };

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontVariables}>
      <body className="min-h-dvh antialiased">
        <ClientMessages locale={locale} messages={[]}>
          <Providers>
            {children}
            <Consent />
          </Providers>
        </ClientMessages>
      </body>
    </html>
  );
}
