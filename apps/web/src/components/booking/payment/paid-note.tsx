import { useTranslations } from "next-intl";

// On the booking page of a booking paid online: when the money comes back.
export function PaidNote() {
  return <p>{useTranslations("payments.paid")("text")}</p>;
}
