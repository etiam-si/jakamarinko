import type { Locale } from "@jakamarinko/types";
import { use } from "react";
import { PackagesJsonLd } from "@/components/site/json-ld";

// The coaching packages and their prices as structured data, next to the page that lists them.
export default function CoachingLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  return (
    <>
      <PackagesJsonLd locale={use(params).locale as Locale} />
      {children}
    </>
  );
}
