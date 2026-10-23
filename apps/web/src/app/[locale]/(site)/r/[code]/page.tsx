import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { offerRules } from "@jakamarinko/api";
import { SectionHeading } from "@/components/brand/section-heading";
import { Section } from "@/components/site/section";
import { euro } from "@/components/site/site";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string; code: string }> };

// A customer's personal link: never indexed.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "offers.invite" });
  return { title: t("meta"), robots: { index: false, follow: false } };
}

// A friend's referral link: 10 € off their first test, the code filled in at the review step.
export default async function InvitePage({ params }: Props) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("offers.invite");
  const format = await getFormatter();
  const amount = euro(format, offerRules.referralCents);
  const clean = decodeURIComponent(code).trim().toUpperCase();

  return (
    <main>
      <Section className="flex max-w-2xl flex-col gap-8 pt-10 md:pt-16">
        <SectionHeading as="h1" title={t("title")} lead={t("text", { amount })} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={{ pathname: "/booking", query: { service: "lactate-profile", code: clean } }} className={buttonVariants({ size: "lg" })}>
            {t("book")}
          </Link>
          <Link href={{ pathname: "/booking", query: { code: clean } }} className={buttonVariants({ size: "lg", variant: "outline" })}>
            {t("other")}
          </Link>
        </div>
      </Section>
    </main>
  );
}
