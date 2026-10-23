"use client";

import type { Service } from "@jakamarinko/api";
import { useFormatter, useTranslations } from "next-intl";
import { euro } from "@/components/site/site";
import { paysOnline, usePayments } from "./payment";

// Under the review: how this booking is paid, and whether the price includes VAT.
export function PaymentNote({ service }: { service: Service }) {
  const t = useTranslations("payments.review");
  const info = usePayments();
  const online = paysOnline(info, service);
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted px-4 py-3 text-sm">
      <p data-testid="payment-note">{online ? t("payOnline", { minutes: info!.holdMin }) : t("payOnSite")}</p>
      {service.priceCents > 0 && (
        <p className="text-sm text-muted-foreground">{info?.pricesIncludeVat === false ? t("vatExcluded") : t("vatIncluded")}</p>
      )}
    </div>
  );
}

// The review's main button says where it leads, and what it costs.
export function usePayLabel(service: Service, submitting: boolean) {
  const t = useTranslations("payments.review");
  const format = useFormatter();
  if (!paysOnline(usePayments(), service)) return null;
  return submitting ? t("paying") : t("pay", { price: euro(format, service.priceCents) });
}
