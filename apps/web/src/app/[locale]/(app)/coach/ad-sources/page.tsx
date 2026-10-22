import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ConversionReport, ConversionReportQuery } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { PageHeader } from "@/components/app-shell/page-header";
import { AdReport } from "@/components/landing/ad-report";
import { api } from "@/lib/api";
import { requireRole } from "@/lib/session";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ from?: string; to?: string }> };

// YYYY-MM-DD in Ljubljana, `days` before today.
const localDay = (days: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Ljubljana" }).format(new Date(Date.now() - days * 86_400_000));

// Owner only (T14): bookings and revenue per ad source. Defaults to the last 30 days.
export default async function AdSourcesPage({ params, searchParams }: Props) {
  const locale = (await params).locale as Locale;
  await requireRole(locale, "/coach/ad-sources", "owner");
  const t = await getTranslations("landing.report");
  const asked = ConversionReportQuery.safeParse(await searchParams);
  const query = asked.success ? asked.data : { from: localDay(30), to: localDay(0) };
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await api.conversions.report.$get({ query }, { headers: { cookie } });
  if (!res.ok) throw new Error(`GET /api/conversions/report failed: ${res.status}`);

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <AdReport from={query.from} to={query.to} report={ConversionReport.parse(await res.json())} />
    </>
  );
}
