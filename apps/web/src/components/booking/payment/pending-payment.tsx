"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { checkoutUrl, usePayments } from "./payment";

const pollMs = 2_000;
const patienceMs = 30_000;

// On the booking page while a booking waits for payment. Back from Stripe (`returned`), the confirmation from Stripe
// may still be on its way, so the page refreshes until the status changes; otherwise it offers the Stripe page again.
export function PendingPayment({ id, token, returned }: { id: string; token?: string; returned: boolean }) {
  const t = useTranslations("payments.pending");
  const router = useRouter();
  const info = usePayments();
  const [state, setState] = useState<"idle" | "opening" | "expired" | "failed">("idle");
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!returned) return;
    const poll = setInterval(() => router.refresh(), pollMs);
    const late = setTimeout(() => setSlow(true), patienceMs);
    return () => {
      clearInterval(poll);
      clearTimeout(late);
    };
  }, [returned, router]);

  async function pay() {
    setState("opening");
    const url = await checkoutUrl(id, token);
    if (url === "expired") return setState("expired");
    if (!url) return setState("failed");
    window.location.assign(url);
  }

  if (returned) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-lg bg-muted p-4">
        <Loader2 aria-hidden className="size-4 shrink-0 animate-spin" />
        {slow ? t("slow") : t("confirming")}
      </p>
    );
  }
  if (state === "expired") return <p className="rounded-lg bg-muted p-4">{t("expired")}</p>;
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-warning/30 bg-warning/10 p-5">
      <p>{t("text", { minutes: info?.holdMin ?? 15 })}</p>
      {state === "failed" && <FieldError role="alert">{t("failed")}</FieldError>}
      <Button size="lg" className="w-full sm:w-auto" loading={state === "opening"} onClick={pay}>
        {state === "opening" ? t("opening") : t("pay")}
      </Button>
    </div>
  );
}
