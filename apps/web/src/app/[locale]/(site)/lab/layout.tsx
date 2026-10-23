import type { Locale } from "@jakamarinko/types";
import { use } from "react";
import { LabTestsJsonLd } from "@/components/site/json-ld";

// The lab tests and their prices as structured data, next to the page that lists them.
export default function LabLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  return (
    <>
      <LabTestsJsonLd locale={use(params).locale as Locale} />
      {children}
    </>
  );
}
