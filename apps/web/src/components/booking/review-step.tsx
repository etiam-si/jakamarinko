"use client";

import type { Service } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { Check, ShieldCheck } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/field";
import { eurFormat, euros } from "@/components/site/site";
import type { Details } from "./details-step";
import { anyYes } from "./health";
import { PaymentNote, usePayLabel } from "./payment/payment-note";
import { formatWhen } from "./time";
import type { Picked } from "./time-step";

export function ReviewStep({
  service,
  slot,
  details,
  preparation,
  submitting,
  onEdit,
  onConfirm,
}: {
  preparation: string[];
  service: Service;
  slot: Picked;
  details: Details;
  submitting: boolean;
  onEdit: (step: "service" | "time" | "details") => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const rows = [
    ["service", service.name, "service"],
    ["when", formatWhen(slot.start, locale), "time"],
    ["duration", t("service.minutes", { count: service.durationMin }), null],
    ["price", format.number(euros(service.priceCents), eurFormat), null],
    ["name", details.name.trim(), "details"],
    ["email", details.email.trim(), "details"],
    ["phone", details.phone.trim(), "details"],
  ] as const;
  const payLabel = usePayLabel(service, submitting);

  return (
    <div className="flex flex-col gap-6">
      <dl className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border bg-card shadow-sm">
        {rows.map(([key, value, edit]) => (
          <div key={key} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-3 px-4 py-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
            <dt className="text-sm text-muted-foreground">{t(`review.${key}`)}</dt>
            <dd className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-medium wrap-anywhere" data-testid={`review-${key}`}>
                {value}
              </span>
              {edit && (
                <Button type="button" variant="link" className="-my-3 -mr-2 h-11 shrink-0 px-2 has-[>svg]:px-2" onClick={() => onEdit(edit)}>
                  {t("review.edit")}
                  <span className="sr-only">{t(`review.${key}`)}</span>
                </Button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {service.kind === "lab_test" && anyYes(details.health) && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">{t("health.doctorNote")}</p>
      )}
      <PaymentNote service={service} />
      <p className="flex items-center gap-2 text-sm font-medium text-success">
        <ShieldCheck aria-hidden className="size-4 shrink-0" />
        {t("time.cancellation")}
      </p>
      {preparation.length > 0 && (
        <section aria-labelledby="review-bring" className="flex flex-col gap-3">
          <h3 id="review-bring" className="font-semibold">
            {t("review.bring")}
          </h3>
          <ul className="flex flex-col gap-2">
            {preparation.slice(0, 3).map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-pretty">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}
      <FormActions>
        <Button type="button" variant="outline" size="lg" onClick={() => onEdit("details")}>
          {t("back")}
        </Button>
        <Button type="button" size="lg" loading={submitting} onClick={onConfirm}>
          {payLabel ?? (submitting ? t("review.confirming") : t("review.confirm"))}
        </Button>
      </FormActions>
    </div>
  );
}
