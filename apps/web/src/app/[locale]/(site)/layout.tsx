import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { labTests } from "@jakamarinko/types";
import { Providers } from "@/components/providers/providers";
import { ClientMessages } from "@/i18n/client-messages";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { StickyBook } from "@/components/site/sticky-book";
import { Reveal } from "@/components/ui/reveal";
import { bookingHref, euros, siteUrl } from "@/components/site/site";

export const metadata: Metadata = { metadataBase: new URL(siteUrl) };

// Header and footer around every public page; the skip link jumps past the header.
export default function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("site");
  const format = useFormatter();
  // The entry test. The message carries the € sign ("{price} €"), so the number goes in plain.
  const lactate = format.number(euros(labTests.find((l) => l.id === "lactate-profile")!.priceCents), { maximumFractionDigits: 2 });
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t("skipToContent")}
      </a>
      <Header />
      <div id="main" tabIndex={-1} className="outline-none">
        {/* The query cache and texts for the few public widgets that ask the api from the browser (the founding
            counter). */}
        <ClientMessages locale={locale} messages={["offers.founding"]}>
          <Providers>{children}</Providers>
        </ClientMessages>
      </div>
      <Footer />
      <StickyBook from={t("sticky.from", { price: lactate })} href={bookingHref("lactate-profile")} label={t("sticky.button")} />
      <Reveal />
    </>
  );
}
