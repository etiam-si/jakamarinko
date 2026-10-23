import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Service } from "@jakamarinko/api";
import { labTests, locales, type Locale } from "@jakamarinko/types";
import { SectionHeading } from "@/components/brand/section-heading";
import { BookingFlow } from "@/components/booking/booking-flow";
import { Unavailable } from "@/components/booking/unavailable";
import { Section } from "@/components/site/section";
import { pageMetadata } from "@/components/site/site";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking.meta" });
  return pageMetadata(locale, "/booking", { title: t("title"), description: t("description") });
}

// null when the api can't be reached: the page then offers phone and email instead.
async function services(locale: Locale) {
  try {
    const res = await api.booking.services.$get({ query: { locale } });
    return res.ok ? Service.array().parse(await res.json()) : null;
  } catch {
    return null;
  }
}

export default async function BookingPage({ params }: Props) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = locales.find((l) => l === raw) ?? "en";
  const t = await getTranslations("booking");
  const [list, session] = await Promise.all([services(locale), getSession().catch(() => null)]);
  const prefill = session && { name: session.user.name, email: session.user.email };
  const preparation = Object.fromEntries(labTests.map((l) => [l.id, l.preparation[locale]]));

  return (
    <main className="overflow-x-clip">
      <Section className="flex max-w-3xl flex-col gap-8 pt-6 pb-12 md:gap-10 md:pt-12 md:pb-20">
        <SectionHeading as="h1" title={t("heading")} lead={t("lead")} />
        {list?.length ? (
          // A card from sm up; on phones the steps sit straight on the page, on its gutters.
          <div className="sm:rounded-2xl sm:border sm:bg-card sm:p-8 sm:shadow-sm">
            <Suspense fallback={<div className="min-h-[34rem]" />}>
              <BookingFlow services={list} prefill={prefill} preparation={preparation} />
            </Suspense>
          </div>
        ) : (
          <Unavailable />
        )}
      </Section>
    </main>
  );
}
