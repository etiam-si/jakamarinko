"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
      <p role="status" className="rounded-md bg-muted p-4">
        {slow ? t("slow") : t("confirming")}
      </p>
    );
  }
  if (state === "expired") return <p className="rounded-md bg-muted p-4">{t("expired")}</p>;
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-amber-500/50 bg-amber-500/10 p-4">
      <p>{t("text", { minutes: info?.holdMin ?? 15 })}</p>
      {state === "failed" && <p role="alert">{t("failed")}</p>}
      <Button size="lg" disabled={state === "opening"} onClick={pay}>
        {state === "opening" ? t("opening") : t("pay")}
      </Button>
    </div>
  );
}
