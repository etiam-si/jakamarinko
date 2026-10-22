"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { type ConsentKind, type ConsentRecord, ConsentInput } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { formatShortDay } from "./format";

const kinds: ConsentKind[] = ["health_data", "marketing"];

// Each consent with the date of its active grant; withdraw or give it again. Withdrawing health data first says
// what stops working. Withdrawing keeps the row (T03), so the history below shows every grant.
export function ConsentsPanel({ history }: { history: ConsentRecord[] }) {
  const t = useTranslations("account.privacy.consents");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [confirmHealth, setConfirmHealth] = useState(false);
  const [pending, setPending] = useState<ConsentKind>();
  const [error, setError] = useState(false);

  const activeGrant = (kind: ConsentKind) => history.find((r) => r.kind === kind && !r.withdrawnAt);

  async function change(kind: ConsentKind, granted: boolean) {
    setPending(kind);
    setError(false);
    const res = await api.auth.consents.$post({ json: ConsentInput.parse({ kind, granted }) });
    setPending(undefined);
    setConfirmHealth(false);
    if (!res.ok) return setError(true);
    // Without health data consent the account sends you to the consent step, as the dialog said.
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y rounded-lg border bg-card">
        {kinds.map((kind) => {
          const grant = activeGrant(kind);
          return (
            <li key={kind} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" data-consent={kind}>
              <div className="flex flex-col gap-0.5">
                <p className="font-medium">{t(kind)}</p>
                <p className="text-sm text-muted-foreground">{grant ? t("given", { date: formatShortDay(grant.grantedAt, locale) }) : t("notGiven")}</p>
              </div>
              {grant ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending === kind}
                  onClick={() => (kind === "health_data" ? setConfirmHealth(true) : change(kind, false))}
                >
                  {t("withdraw")}
                </Button>
              ) : (
                <Button size="sm" disabled={pending === kind} onClick={() => change(kind, true)}>
                  {t("grant")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("error")}
        </p>
      )}
      {history.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">{t("history")}</summary>
          <ul className="mt-2 flex flex-col gap-1 pl-4">
            {history.map((r) => (
              <li key={`${r.kind}-${r.grantedAt}`}>
                {r.withdrawnAt
                  ? t("historyWithdrawn", {
                      kind: t(r.kind),
                      date: formatShortDay(r.grantedAt, locale),
                      withdrawn: formatShortDay(r.withdrawnAt, locale),
                    })
                  : t("historyGiven", { kind: t(r.kind), date: formatShortDay(r.grantedAt, locale) })}
              </li>
            ))}
          </ul>
        </details>
      )}

      <Dialog open={confirmHealth} onOpenChange={setConfirmHealth}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("healthTitle")}</DialogTitle>
            <DialogDescription>{t("healthIntro")}</DialogDescription>
          </DialogHeader>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
            <li>{t("healthStop1")}</li>
            <li>{t("healthStop2")}</li>
            <li>{t("healthStop3")}</li>
          </ul>
          <p className="text-sm text-muted-foreground">{t("healthKeeps")}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("healthCancel")}</Button>
            </DialogClose>
            <Button variant="destructive" disabled={pending === "health_data"} onClick={() => change("health_data", false)}>
              {t("healthConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
