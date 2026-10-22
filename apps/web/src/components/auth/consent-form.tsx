"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConsentInput } from "@jakamarinko/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
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
    <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
      <p className="text-sm text-pretty text-muted-foreground">{t("intro")}</p>
      <div className="flex gap-3 rounded-lg border p-4 has-[[aria-invalid=true]]:border-destructive">
        <Checkbox id="health" checked={health} onCheckedChange={(v) => setHealth(v === true)} aria-invalid={!!error} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="health">{t("healthData")}</Label>
          <p className="text-sm text-muted-foreground">{t("healthDataHint")}</p>
        </div>
      </div>
      <div className="flex gap-3 rounded-lg border p-4">
        <Checkbox id="marketing" checked={marketing} onCheckedChange={(v) => setMarketing(v === true)} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="marketing" className="font-normal">
            {t("marketing")}
          </Label>
          <p className="text-sm text-muted-foreground">{t("marketingHint")}</p>
        </div>
      </div>
      <FieldError role="alert">{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {t("submit")}
      </Button>
      <Link href="/legal/privacy" className="self-center text-sm text-muted-foreground underline underline-offset-4">
        {t("privacy")}
      </Link>
    </form>
  );
}
