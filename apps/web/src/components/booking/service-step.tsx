"use client";

import type { Service } from "@jakamarinko/api";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FormActions } from "@/components/ui/field";
import { euro } from "@/components/site/site";
import { Choice } from "./choice";

// The first test most people should book comes first, then the best value; the rest keep the api's order.
const featured = ["lactate-profile", "performance"];
export const serviceOrder = <S extends { id: string }>(services: S[]) =>
  [...services].sort((a, b) => rank(a.id) - rank(b.id));
const rank = (id: string) => (featured.includes(id) ? featured.indexOf(id) : featured.length);

export function ServiceStep({ services, initial, onContinue }: { services: Service[]; initial?: string; onContinue: (id: string) => void }) {
  const t = useTranslations("booking");
  const format = useFormatter();
  const [picked, setPicked] = useState(initial);
  const [error, setError] = useState(false);
  // Badges and one-line summaries exist for the catalog's services; a new one simply shows without them.
  const extra = (group: "badges" | "lines", id: string) => (t.has(`service.${group}.${id}`) ? t(`service.${group}.${id}`) : null);

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
        {serviceOrder(services).map((s) => {
          const badge = extra("badges", s.id);
          const line = extra("lines", s.id);
          return (
            <Choice key={s.id} name="service" value={s.id} checked={picked === s.id} onChange={setPicked} variant="card" className="items-start">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                {badge && (
                  <span className="flex items-start gap-1.5 font-mono text-xs tracking-wider text-primary uppercase">
                    <span aria-hidden className="mt-[5px] size-1.5 shrink-0 rounded-full bg-signal" />
                    {badge}
                  </span>
                )}
                <span className="font-semibold text-pretty">{s.name}</span>
                {line && <span className="text-sm text-pretty text-muted-foreground">{line}</span>}
                <span className="text-sm text-muted-foreground">{t("service.about", { count: s.durationMin })}</span>
              </span>
              <span className="shrink-0 font-heading text-lg font-bold tabular-nums font-stretch-expanded">
                {euro(format, s.priceCents)}
              </span>
            </Choice>
          );
        })}
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
