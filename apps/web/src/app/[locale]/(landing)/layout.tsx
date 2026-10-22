import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { LandingFooter, LandingHeader } from "@/components/landing/frame";
import { siteUrl } from "@/components/site/site";

export const metadata: Metadata = { metadataBase: new URL(siteUrl) };

// Ad landing pages (T14), outside (site) so they don't get the site's menu and footer.
export default function LandingLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <LandingHeader />
      {children}
      <LandingFooter />
    </>
  );
}
