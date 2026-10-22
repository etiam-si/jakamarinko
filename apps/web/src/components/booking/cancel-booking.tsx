"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { Unavailable } from "./unavailable";

// Free cancellation from the link in the emails, until 24 h before the start (the api decides).
export function CancelBooking({ id, token, cancellable }: { id: string; token?: string; cancellable: boolean }) {
  const t = useTranslations("booking.manage");
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [state, setState] = useState<"idle" | "cancelling" | "tooLate" | "failed">(cancellable ? "idle" : "tooLate");

  async function cancel() {
    setState("cancelling");
    try {
      const res = await api.booking[":id"].cancel.$post({ param: { id }, query: { token } });
      const status: number = res.status;
      if (res.ok) return router.refresh();
      if (status === 409) {
        const body = (await res.json()) as unknown as { error?: { code?: string } };
        if (body.error?.code === "too_late") return setState("tooLate");
        return router.refresh();
      }
      setState("failed");
    } catch {
      setState("failed");
    }
  }

  if (state === "tooLate") return <p className="rounded-md bg-muted p-4">{t("tooLate")}</p>;
  if (state === "failed") return <Unavailable />;
  if (!asking) {
    return (
      <Button variant="outline" size="lg" className="self-start" onClick={() => setAsking(true)}>
        {t("cancel")}
      </Button>
    );
  }
  return (
    <div role="group" aria-labelledby="cancel-question" className="flex flex-col gap-3 rounded-md border border-border p-4">
      <p id="cancel-question">{t("cancelConfirm")}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="destructive" size="lg" disabled={state === "cancelling"} onClick={cancel} autoFocus>
          {state === "cancelling" ? t("cancelling") : t("cancelYes")}
        </Button>
        <Button variant="outline" size="lg" onClick={() => setAsking(false)}>
          {t("cancelNo")}
        </Button>
      </div>
    </div>
  );
}
