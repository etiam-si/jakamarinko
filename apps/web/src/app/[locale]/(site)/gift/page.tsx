import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PaymentsInfo, Service } from "@jakamarinko/api";
import { locales } from "@jakamarinko/types";
import { SectionHeading } from "@/components/brand/section-heading";
import { BuyGift } from "@/components/offers/buy-gift";
import { Section } from "@/components/site/section";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "offers.buyGift" });
  return { title: t("meta"), description: t("lead") };
}

// Buying a gift voucher: online with Stripe when payments are on, otherwise by getting in touch.
export default async function BuyGiftPage({ params }: Props) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = locales.find((l) => l === raw) ?? "en";
  const t = await getTranslations("offers.buyGift");
  // Asked on every request: whether online payment is on can change without a new build.
  await connection();
  const [config, services] = await Promise.all([
    api.payments.config
      .$get()
      .then(async (r) => (r.ok ? PaymentsInfo.parse(await r.json()) : null))
      .catch(() => null),
    api.booking.services
      .$get({ query: { locale } })
      .then(async (r) => (r.ok ? Service.array().parse(await r.json()) : []))
      .catch(() => []),
  ]);
  const tests = services.filter((s) => s.kind === "lab_test" && (s.id as string) !== "lactate-retest");

  return (
    <main>
      <Section className="flex max-w-2xl flex-col gap-8 pt-10 md:pt-16">
        <SectionHeading as="h1" title={t("title")} lead={t("lead")} />
        {config?.enabled && tests.length ? (
          <BuyGift services={tests} />
        ) : (
          <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-6 shadow-sm">
            <p data-testid="gift-contact">{t("contact")}</p>
            <Link href="/contact" className={buttonVariants({ size: "lg" })}>
              {t("contactAction")}
            </Link>
          </div>
        )}
      </Section>
    </main>
  );
}
