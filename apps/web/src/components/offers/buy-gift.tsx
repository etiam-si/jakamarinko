"use client";

import { GiftCheckout, type Service } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { eurFormat, euros } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { NativeSelect } from "./native-select";

// A gift voucher for one test, paid on Stripe's page. The voucher arrives by email once paid.
export function BuyGift({ services }: { services: Service[] }) {
  const t = useTranslations("offers.buyGift");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const [service, setService] = useState(services[0]!.id);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [state, setState] = useState<"idle" | "paying" | "failed">("idle");

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setState("paying");
    try {
      const res = await api.offers.gifts.checkout.$post({ json: { service, buyerEmail, recipientName: recipientName || undefined, locale } });
      if (!res.ok) throw new Error(String(res.status));
      window.location.assign(GiftCheckout.parse(await res.json()).url);
    } catch {
      setState("failed");
    }
  }

  return (
    <form onSubmit={pay} className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <Field>
        <Label htmlFor="gift-service">{t("service")}</Label>
        <NativeSelect id="gift-service" value={service} onChange={(e) => setService(e.target.value as Service["id"])}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {format.number(euros(s.priceCents), eurFormat)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field>
        <Label htmlFor="gift-buyer">{t("buyerEmail")}</Label>
        <Input id="gift-buyer" type="email" required autoComplete="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} aria-describedby="gift-buyer-hint" />
        <FieldHint id="gift-buyer-hint">{t("buyerHint")}</FieldHint>
      </Field>
      <Field>
        <Label htmlFor="gift-recipient">{t("recipient")}</Label>
        <Input id="gift-recipient" value={recipientName} maxLength={200} onChange={(e) => setRecipientName(e.target.value)} />
      </Field>
      {state === "failed" && <FieldError role="alert">{t("failed")}</FieldError>}
      <Button type="submit" size="lg" loading={state === "paying"} className="self-start">
        {state === "paying" ? t("paying") : t("pay")}
      </Button>
    </form>
  );
}
