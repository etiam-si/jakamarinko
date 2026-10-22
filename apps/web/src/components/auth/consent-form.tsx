"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConsentInput } from "@jakamarinko/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

export function ConsentForm({ next }: { next?: string }) {
  const t = useTranslations("auth.consent");
  const router = useRouter();
  const [health, setHealth] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!health) return setError(t("required"));
    setPending(true);
    setError(undefined);
    const grants = [ConsentInput.parse({ kind: "health_data", granted: true })];
    if (marketing) grants.push(ConsentInput.parse({ kind: "marketing", granted: true }));
    for (const json of grants) {
      const res = await api.auth.consents.$post({ json });
      if (!res.ok) {
        setPending(false);
        return setError(t("error"));
      }
    }
    router.replace({ pathname: "/sign-in/continue", query: next ? { next } : {} });
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
      <p className="text-muted-foreground">{t("intro")}</p>
      <div className="flex gap-3">
        <Checkbox id="health" checked={health} onCheckedChange={(v) => setHealth(v === true)} aria-invalid={!!error} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="health">{t("healthData")}</Label>
          <p className="text-sm text-muted-foreground">{t("healthDataHint")}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Checkbox id="marketing" checked={marketing} onCheckedChange={(v) => setMarketing(v === true)} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="marketing">{t("marketing")}</Label>
          <p className="text-sm text-muted-foreground">{t("marketingHint")}</p>
        </div>
      </div>
      <Link href="/legal/privacy" className="text-sm underline underline-offset-4">
        {t("privacy")}
      </Link>
      <Button type="submit" size="lg" disabled={pending}>
        {t("submit")}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
