import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { type Locale, locales } from "@jakamarinko/types";
import { LandingBlocks } from "@/components/landing/blocks";
import { landingPage, landingPages } from "@/components/landing/pages";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => landingPages.map((page) => ({ locale, slug: page.slug })));
}

// For ad traffic only: kept out of search results and out of the sitemap.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "landing.pages" });
  if (!landingPage(slug)) return {};
  return {
    title: t(`${slug}.meta.title`),
    description: t(`${slug}.meta.description`),
    robots: { index: false, follow: false },
  };
}

export default function LandingPage({ params }: Props) {
  const { locale, slug } = use(params);
  setRequestLocale(locale);
  const page = landingPage(slug);
  if (!page) notFound();
  return <LandingBlocks page={page} locale={locale as Locale} />;
}
