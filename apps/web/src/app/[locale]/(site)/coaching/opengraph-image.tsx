import { ogAlt, ogImage, ogSize } from "@/components/site/og-image";
import { routing } from "@/i18n/routing";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  return ogImage((await params).locale, "coaching");
}
