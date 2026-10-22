"use client";

import type { Service } from "@jakamarinko/api";
import { useTranslations } from "next-intl";
import { paysOnline, usePayments } from "./payment";

// Under the review: how this booking is paid, and whether the price includes VAT.
export function PaymentNote({ service }: { service: Service }) {
  const t = useTranslations("payments.review");
  const info = usePayments();
  const online = paysOnline(info, service);
  return (
    <div className="flex flex-col gap-1">
      <p data-testid="payment-note">{online ? t("payOnline", { minutes: info!.holdMin }) : t("payOnSite")}</p>
      {service.priceCents > 0 && (
        <p className="text-sm text-muted-foreground">{info?.pricesIncludeVat === false ? t("vatExcluded") : t("vatIncluded")}</p>
      )}
    </div>
  );
}

// The review's main button says where it leads.
export function usePayLabel(service: Service, submitting: boolean) {
  const t = useTranslations("payments.review");
  if (!paysOnline(usePayments(), service)) return null;
  return submitting ? t("paying") : t("pay");
}
