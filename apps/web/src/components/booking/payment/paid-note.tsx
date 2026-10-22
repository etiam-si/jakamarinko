import { useTranslations } from "next-intl";

// On the booking page of a booking paid online: when the money comes back.
export function PaidNote() {
  return <p className="rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-sm">{useTranslations("payments.paid")("text")}</p>;
}
