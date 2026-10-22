import type { Metadata } from "next";
import { useFormatter, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { labTests } from "@jakamarinko/types";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { StickyBook } from "@/components/site/sticky-book";
import { eurFormat, euros, siteUrl } from "@/components/site/site";

export const metadata: Metadata = { metadataBase: new URL(siteUrl) };

// Header and footer around every public page; the skip link jumps past the header.
export default function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("site");
  const format = useFormatter();
  const cheapest = format.number(euros(Math.min(...labTests.map((l) => l.priceCents))), eurFormat);
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
        {children}
      </div>
      <Footer />
      <StickyBook from={t("sticky.from", { price: cheapest })} />
    </>
  );
}
