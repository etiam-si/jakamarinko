import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Service } from "@jakamarinko/api";
import { locales, type Locale } from "@jakamarinko/types";
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

  return (
    <main>
      <Section className="flex max-w-2xl flex-col gap-10 pt-10 md:pt-16">
        <SectionHeading as="h1" title={t("title")} />
        {list?.length ? (
          <Suspense>
            <BookingFlow services={list} prefill={prefill} />
          </Suspense>
        ) : (
          <Unavailable />
        )}
      </Section>
    </main>
  );
}
