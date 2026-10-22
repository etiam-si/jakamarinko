import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { OffersReport, OffersReportQuery, Service, roleAllows } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { PageHeader } from "@/components/app-shell/page-header";
import { FoundingPanel, FreeTestForm, GiftForm, NewCodeForm } from "@/components/offers/offers-admin";
import { OffersReportView } from "@/components/offers/offers-report";
import { api } from "@/lib/api";
import { requireRole } from "@/lib/session";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ from?: string; to?: string }> };

// YYYY-MM-DD in Ljubljana, `days` before today.
const localDay = (days: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Ljubljana" }).format(new Date(Date.now() - days * 86_400_000));

// Owner and head coach: give free tests, make codes and vouchers, switch the founding offer, see what was used.
export default async function OffersPage({ params, searchParams }: Props) {
  const locale = (await params).locale as Locale;
  const session = await requireRole(locale, "/coach/offers", "head_coach");
  const t = await getTranslations("offers.coach");
  const asked = OffersReportQuery.safeParse(await searchParams);
  const query = asked.success ? asked.data : { from: localDay(30), to: localDay(0) };
  const cookie = (await headers()).get("cookie") ?? "";
  const [reportRes, servicesRes] = await Promise.all([
    api.offers.report.$get({ query }, { headers: { cookie } }),
    api.booking.services.$get({ query: { locale } }),
  ]);
  if (!reportRes.ok) throw new Error(`GET /api/offers/report failed: ${reportRes.status}`);
  const report = OffersReport.parse(await reportRes.json());
  const services = servicesRes.ok ? Service.array().parse(await servicesRes.json()) : [];
  const options = services.map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <FreeTestForm services={options} />
        <NewCodeForm services={options} />
        <GiftForm services={options} />
        <FoundingPanel founding={report.founding} canSwitch={roleAllows(session.user.role, ["owner"])} />
      </div>
      <OffersReportView from={query.from} to={query.to} report={report} services={options} />
    </>
  );
}
