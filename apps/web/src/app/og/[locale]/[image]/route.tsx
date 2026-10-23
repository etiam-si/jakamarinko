import { locales } from "@jakamarinko/types";
import { ogImage, ogPages } from "@/components/site/og-image";

// Link preview images, /og/<locale>/<page>.png, all rendered at build time (components/site/og-image.tsx).
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => Object.keys(ogPages).map((key) => ({ locale, image: `${key}.png` })));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; image: string }> }) {
  const { locale, image } = await params;
  return ogImage(locale, image.replace(/\.png$/, ""));
}
