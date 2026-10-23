import type { Metadata } from "next";
import { headers } from "next/headers";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { GiftVoucher } from "@jakamarinko/api";
import { locales } from "@jakamarinko/types";
import { SectionHeading } from "@/components/brand/section-heading";
import { Unavailable } from "@/components/booking/unavailable";
import { PrintButton } from "@/components/offers/print-button";
import { Section } from "@/components/site/section";
import { euro } from "@/components/site/site";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";

type Props = { params: Promise<{ locale: string; code: string }>; searchParams: Promise<{ paid?: string }> };

// Whoever has the link can use the voucher: never indexed.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "offers.gift" });
  return { title: t("meta"), robots: { index: false, follow: false } };
}

async function load(code: string, locale: (typeof locales)[number]) {
  try {
    // The api limits lookups per visitor, so it gets the visitor's address, not this server's.
    const ip = (await headers()).get("cf-connecting-ip");
    const res = await api.offers.gift[":code"].$get({ param: { code }, query: { locale } }, { headers: ip ? { "cf-connecting-ip": ip } : {} });
    if (res.ok) return GiftVoucher.parse(await res.json());
    return res.status === 404 ? "notFound" : "unavailable";
  } catch {
    return "unavailable";
  }
}

// A gift voucher to print or forward: what it's worth, its code and a book link with the code filled in.
export default async function GiftPage({ params, searchParams }: Props) {
  const { locale: raw, code } = await params;
  setRequestLocale(raw);
  const locale = locales.find((l) => l === raw) ?? "en";
  const t = await getTranslations("offers.gift");
  const format = await getFormatter();
  const voucher = await load(decodeURIComponent(code), locale);
  const { paid } = await searchParams;

  if (typeof voucher === "string") {
    return (
      <main>
        <Section className="flex max-w-2xl flex-col gap-8 pt-10 md:pt-16">
          <SectionHeading as="h1" title={t("title")} />
          {voucher === "notFound" ? <p>{t("notFound")}</p> : <Unavailable />}
        </Section>
      </main>
    );
  }

  const worth = t("worth", { amount: euro(format, voucher.valueCents) });
  const book = { pathname: "/booking", query: { ...(voucher.service && { service: voucher.service }), code: voucher.code } };
  return (
    <main>
      <Section className="flex max-w-2xl flex-col gap-8 pt-10 md:pt-16">
        {paid === "1" && (
          <p role="status" className="rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-sm print:hidden">
            {t("paid")}
          </p>
        )}
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary-deep p-8 text-primary-foreground shadow-lg md:p-12 print:shadow-none">
          <p className="font-mono text-xs tracking-wider uppercase opacity-85">{t("title")}</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance font-stretch-expanded md:text-5xl" data-testid="gift-value">
            {voucher.serviceName ? t("service", { service: voucher.serviceName }) : worth}
          </h1>
          {voucher.serviceName && <p className="text-lg font-semibold">{worth}</p>}
          {voucher.recipientName && <p className="text-lg">{t("for", { name: voucher.recipientName })}</p>}
          <dl>
            <dt className="text-sm opacity-85">{t("codeLabel")}</dt>
            <dd className="font-mono text-xl font-semibold tracking-wider" data-testid="gift-code">
              {voucher.code}
            </dd>
          </dl>
          {voucher.expiresAt && (
            <p className="text-sm opacity-85">
              {t("validUntil", { date: format.dateTime(new Date(voucher.expiresAt), { dateStyle: "long", timeZone: "Europe/Ljubljana" }) })}
            </p>
          )}
        </div>
        {voucher.used ? (
          <p className="rounded-lg bg-muted px-4 py-3 text-sm">{t("used")}</p>
        ) : (
          <>
            <p className="text-pretty text-muted-foreground">{t("howTo")}</p>
            <div className="flex flex-col gap-3 sm:flex-row print:hidden">
              <Link href={book} className={buttonVariants({ size: "lg" })}>
                {t("book")}
              </Link>
              <PrintButton label={t("print")} />
            </div>
          </>
        )}
      </Section>
    </main>
  );
}
