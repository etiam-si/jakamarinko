"use client";

import { TicketPercent } from "lucide-react";
import type { OffersReport } from "@jakamarinko/api";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app-shell/empty-state";
import { euro } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/ui/stat-card";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { ServiceOption } from "./offers-admin";

type Row = OffersReport["codes"][number];

// Usage for a date range (a plain GET form, so the range is in the URL): totals, then every code with its limits.
export function OffersReportView({ from, to, report, services }: { from: string; to: string; report: OffersReport; services: ServiceOption[] }) {
  const t = useTranslations("offers.coach.report");
  const tCode = useTranslations("offers.coach.newCode");
  const tFounding = useTranslations("offers.coach.founding");
  const format = useFormatter();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const eur = (cents: number) => euro(format, cents);
  const day = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium", timeZone: "Europe/Ljubljana" });
  const name = (id: string) => services.find((s) => s.id === id)?.name ?? id;
  const cell = "px-4 py-3 align-top";

  const discount = (r: Row) =>
    r.discountType === "free" ? t("free") : r.discountType === "percent" ? t("percentOff", { value: r.value }) : t("eurosOff", { amount: eur(r.value) });
  const limits = (r: Row) =>
    [
      r.maxUses !== null ? t("allUses", { uses: r.uses, max: r.maxUses }) : t("unlimited", { uses: r.uses }),
      r.expiresAt && t("until", { date: day(r.expiresAt) }),
      r.email && t("onlyFor", { email: r.email }),
    ].filter(Boolean);

  async function toggle(r: Row) {
    setBusy(r.id);
    try {
      const res = await api.offers.codes[":id"].$patch({ param: { id: r.id }, json: { active: !r.active } });
      if (!res.ok) throw new Error(String(res.status));
      router.refresh();
    } catch {
      toast.error(tFounding("failed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="offers-report">
      <h2 id="offers-report" className="text-lg font-semibold">
        {t("title")}
      </h2>
      <form className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <Label htmlFor="offers-from">{t("from")}</Label>
          <Input id="offers-from" name="from" type="date" defaultValue={from} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="offers-to">{t("to")}</Label>
          <Input id="offers-to" name="to" type="date" defaultValue={to} required />
        </div>
        <Button type="submit" size="lg">
          {t("show")}
        </Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-3" data-testid="offers-totals">
        <StatCard label={t("uses")} value={report.totals.redemptions} />
        <StatCard label={t("revenue")} value={eur(report.totals.revenueCents)} />
        <StatCard label={t("discount")} value={eur(report.totals.discountCents)} />
      </div>
      {report.codes.length === 0 && report.foundingPeriod.redemptions === 0 ? (
        <EmptyState icon={TicketPercent} title={t("empty")} body={t("note")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <tr>
                <th className={cell}>{t("code")}</th>
                <th className={cell}>{t("value")}</th>
                <th className={cell}>{t("limits")}</th>
                <th className={`${cell} text-right`}>{t("uses")}</th>
                <th className={`${cell} text-right`}>{t("revenue")}</th>
                <th className={`${cell} text-right`}>{t("discount")}</th>
                <th className={cell}>
                  <span className="sr-only">{t("switchOff")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.foundingPeriod.redemptions > 0 && (
                <tr>
                  <td className={cell} colSpan={3}>
                    {t("foundingRow")}
                  </td>
                  <td className={`${cell} text-right tabular-nums`}>{report.foundingPeriod.redemptions}</td>
                  <td className={`${cell} text-right tabular-nums`}>{eur(report.foundingPeriod.revenueCents)}</td>
                  <td className={`${cell} text-right tabular-nums`}>{eur(report.foundingPeriod.discountCents)}</td>
                  <td className={cell} />
                </tr>
              )}
              {report.codes.map((r) => (
                <tr key={r.id} data-code={r.code} className={r.active ? undefined : "text-muted-foreground"}>
                  <td className={cell}>
                    <span className="font-mono font-semibold">{r.code}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t(`kinds.${r.kind}`)}
                      {r.recipientName ? ` · ${r.recipientName}` : ""}
                      {!r.active ? ` · ${t("inactive")}` : ""}
                    </span>
                    {r.note && <span className="block text-xs text-muted-foreground">{r.note}</span>}
                  </td>
                  <td className={cell}>
                    {discount(r)}
                    <span className="block text-xs text-muted-foreground">{r.services ? r.services.map(name).join(", ") : tCode("allServices")}</span>
                  </td>
                  <td className={cell}>
                    {limits(r).map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </td>
                  <td className={`${cell} text-right tabular-nums`}>{r.period.redemptions}</td>
                  <td className={`${cell} text-right tabular-nums`}>{eur(r.period.revenueCents)}</td>
                  <td className={`${cell} text-right tabular-nums`}>{eur(r.period.discountCents)}</td>
                  <td className={`${cell} text-right`}>
                    <Button type="button" size="sm" variant="outline" loading={busy === r.id} onClick={() => toggle(r)}>
                      {r.active ? t("switchOff") : t("switchOn")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="max-w-2xl text-sm text-muted-foreground">{t("note")}</p>
    </section>
  );
}
