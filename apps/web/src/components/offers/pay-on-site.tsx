import { useFormatter, useTranslations } from "next-intl";
import { euro } from "@/components/site/site";

// On the booked page of a booking paid on site: what to pay, after any code or discount.
export function PayOnSite({ priceCents }: { priceCents: number }) {
  const t = useTranslations("offers.paid");
  const format = useFormatter();
  return (
    <span data-testid="pay-on-site">
      {priceCents === 0 ? t("nothingToPay") : t("payOnSite", { price: euro(format, priceCents) })}
    </span>
  );
}
