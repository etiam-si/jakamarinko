"use client";

import type { Service } from "@jakamarinko/api";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FormActions } from "@/components/ui/field";
import { eurFormat, euros } from "@/components/site/site";
import { Choice } from "./choice";

export function ServiceStep({ services, initial, onContinue }: { services: Service[]; initial?: string; onContinue: (id: string) => void }) {
  const t = useTranslations("booking");
  const format = useFormatter();
  const [picked, setPicked] = useState(initial);
  const [error, setError] = useState(false);

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (picked) onContinue(picked);
        else setError(true);
      }}
    >
      <fieldset className="flex flex-col gap-3" aria-describedby={error ? "service-error" : undefined}>
        <legend className="sr-only">{t("service.heading")}</legend>
        {services.map((s) => (
          <Choice key={s.id} name="service" value={s.id} checked={picked === s.id} onChange={setPicked} className="justify-between gap-4 p-4 text-left">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-semibold">{s.name}</span>
              <span className="text-sm opacity-80">{t("service.minutes", { count: s.durationMin })}</span>
            </span>
            <span className="shrink-0 font-heading text-lg font-bold tabular-nums">{format.number(euros(s.priceCents), eurFormat)}</span>
          </Choice>
        ))}
      </fieldset>
      {error && (
        <FieldError id="service-error" role="alert">
          {t("service.required")}
        </FieldError>
      )}
      <FormActions>
        <Button type="submit" size="lg">
          {t("continue")}
        </Button>
      </FormActions>
    </form>
  );
}
