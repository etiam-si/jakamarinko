import { BarChart3 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ConversionReport } from "@jakamarinko/api";
import { EmptyState } from "@/components/app-shell/empty-state";
import { eurFormat, euros } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// The owner's report: a date range (a plain GET form, so the range is in the URL) and bookings and revenue per source.
export function AdReport({ from, to, report }: { from: string; to: string; report: ConversionReport }) {
  const t = useTranslations("landing.report");
  const format = useFormatter();
  const eur = (cents: number) => format.number(euros(cents), eurFormat);
  const cell = "px-4 py-3";

  return (
    <>
      <form className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <Label htmlFor="report-from">{t("from")}</Label>
          <Input id="report-from" name="from" type="date" defaultValue={from} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="report-to">{t("to")}</Label>
          <Input id="report-to" name="to" type="date" defaultValue={to} required />
        </div>
        <Button type="submit">{t("show")}</Button>
      </form>
      {report.rows.length === 0 ? (
        <EmptyState icon={BarChart3} title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <tr>
                <th className={cell}>{t("source")}</th>
                <th className={cell}>{t("campaign")}</th>
                <th className={`${cell} text-right`}>{t("bookings")}</th>
                <th className={`${cell} text-right`}>{t("revenue")}</th>
              </tr>
            </thead>
            <tbody className="divide-y [&>tr]:transition-colors [&>tr:hover]:bg-muted/30">
              {report.rows.map((r) => (
                <tr key={`${r.source}|${r.campaign}`}>
                  <td className={cell}>{r.source ?? t("unknown")}</td>
                  <td className={cell}>{r.campaign ?? t("unknown")}</td>
                  <td className={`${cell} text-right tabular-nums`}>{r.bookings}</td>
                  <td className={`${cell} text-right tabular-nums`}>{eur(r.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t font-semibold">
              <tr>
                <td className={cell} colSpan={2}>
                  {t("total")}
                </td>
                <td className={`${cell} text-right tabular-nums`}>{report.total.bookings}</td>
                <td className={`${cell} text-right tabular-nums`}>{eur(report.total.revenueCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="max-w-2xl text-sm text-muted-foreground">{t("note")}</p>
    </>
  );
}
