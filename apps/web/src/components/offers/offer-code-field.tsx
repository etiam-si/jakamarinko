"use client";

import { useQuery } from "@tanstack/react-query";
import { offerRules, Quote, type Service } from "@jakamarinko/api";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { euro } from "@/components/site/site";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";

async function fetchQuote(service: string, email: string, code: string) {
  const res = await api.offers.quote.$post({ json: { service: service as Service["id"], email: email || undefined, code: code || undefined } });
  if (!res.ok) throw new Error(`quote: ${res.status}`);
  return Quote.parse(await res.json());
}

// At the booking review: the code field (pre-filled from ?code=) and the price with the code or the founding
// discount. `code` is what goes with the booking; it's only set once the api accepted it.
export function OfferCodeField({
  service,
  email,
  code,
  onCode,
}: {
  service: Service;
  email: string;
  code: string;
  onCode: (code: string) => void;
}) {
  const t = useTranslations("offers.code");
  const format = useFormatter();
  const id = useId();
  const [draft, setDraft] = useState(code);
  const [asked, setAsked] = useState(code);
  const eur = (cents: number) => euro(format, cents);

  const quote = useQuery({
    queryKey: ["offer-quote", service.id, email.trim().toLowerCase(), asked],
    queryFn: () => fetchQuote(service.id, email.trim(), asked),
    retry: false,
    staleTime: 30_000,
  });
  const q = quote.data;
  const error = asked && q?.codeError ? t(`errors.${q.codeError}`) : quote.isError && asked ? t("errors.failed") : null;
  // The code goes with the booking only when it is valid; a bad one never blocks confirming at the full price.
  const valid = !!asked && !!q && !q.codeError;
  const rejected = !!q?.codeError || quote.isError;
  useEffect(() => {
    if (valid && code !== asked) onCode(asked);
    else if (!valid && code && rejected) onCode("");
  }, [valid, rejected, code, asked, onCode]);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    setAsked(draft.trim());
  }

  function remove() {
    setDraft("");
    setAsked("");
    onCode("");
  }

  return (
    <div className="flex flex-col gap-4" data-testid="offer">
      {q && (service.id as string) === "lactate-retest" && !q.retestEligible && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
          <p className="font-semibold">{t("retest.title")}</p>
          <p>{t("retest.text", { email: email.trim() })}</p>
          <Link href={{ pathname: "/booking", query: { service: "lactate-profile" } }} className={buttonVariants({ variant: "outline", size: "lg" })}>
            {t("retest.action")}
          </Link>
        </div>
      )}

      <Field>
        <Label htmlFor={`${id}-code`}>{t("label")}</Label>
        <div className="flex gap-2">
          <Input
            id={`${id}-code`}
            name="offer-code"
            value={draft}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply(e);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : `${id}-hint`}
            className="uppercase placeholder:normal-case"
          />
          {valid && draft.trim().toUpperCase() === q.code ? (
            <Button type="button" variant="outline" size="lg" onClick={remove}>
              {t("remove")}
            </Button>
          ) : (
            <Button type="button" variant="outline" size="lg" onClick={() => apply()} disabled={!draft.trim()} loading={quote.isFetching && !!asked}>
              {quote.isFetching && asked ? t("applying") : t("apply")}
            </Button>
          )}
        </div>
        {error ? (
          <FieldError id={`${id}-error`} role="alert">
            {error}
          </FieldError>
        ) : valid && q.source === "code" ? (
          <FieldHint id={`${id}-hint`} role="status">
            {t("applied", { code: q.code! })}
          </FieldHint>
        ) : valid && q.source === "founding" ? (
          <FieldHint id={`${id}-hint`} role="status">
            {t("foundingWins")}
          </FieldHint>
        ) : (
          <FieldHint id={`${id}-hint`}>{t("hint")}</FieldHint>
        )}
      </Field>

      {q && q.savedCents > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-success/25 bg-success/10 px-4 py-3" data-testid="offer-price">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-sm text-muted-foreground">{t("yourPrice")}</span>
            <s className="text-muted-foreground tabular-nums">
              <span className="sr-only">{t("was")} </span>
              {eur(q.listCents)}
            </s>
            <span className="text-lg font-bold tabular-nums" data-testid="offer-new-price">
              {eur(q.priceCents)}
            </span>
          </p>
          {q.source === "founding" && <p className="text-sm">{t("founding", { percent: offerRules.foundingPercent })}</p>}
          {q.priceCents === 0 && <p className="text-sm font-medium">{t("nothingToPay")}</p>}
        </div>
      )}
    </div>
  );
}
