"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePayments } from "@/components/booking/payment/payment";

// "How do I pay?" depends on whether online payment is switched on (a runtime flag of the api), so this one question
// is answered in the browser, with the same check the booking review uses. Nothing shows until the answer is known.
// Not on a page yet: the FAQPage structured data must list exactly the questions shown, and this one is only known
// in the browser. Use it once online payment is decided (or render its question into the structured data too).
export function PaymentFaq() {
  const t = useTranslations("landing.faq.payment");
  const info = usePayments();
  if (!info) return null;
  return (
    <details className="group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium transition-colors duration-(--duration-fast) hover:text-primary [&::-webkit-details-marker]:hidden">
        {t("question")}
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground transition-[rotate,background-color,color] duration-(--duration-base) ease-(--ease-out-quart) group-open:rotate-45 group-open:bg-primary group-open:text-primary-foreground"
        >
          <Plus className="size-4" />
        </span>
      </summary>
      <p className="max-w-2xl pr-12 pb-5 text-muted-foreground">{info.enabled ? t("answerOnline") : t("answerOnSite")}</p>
    </details>
  );
}
