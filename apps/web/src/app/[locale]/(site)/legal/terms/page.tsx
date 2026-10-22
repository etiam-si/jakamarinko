import { setRequestLocale } from "next-intl/server";
import { LegalDocument, legalMetadata } from "../legal-document";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return legalMetadata((await params).locale, "terms");
}

export default async function Page({ params }: Props) {
  setRequestLocale((await params).locale);
  return <LegalDocument doc="terms" />;
}
