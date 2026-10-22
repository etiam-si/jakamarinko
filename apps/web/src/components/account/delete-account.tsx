"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiErrorBody } from "@jakamarinko/api";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";

const errorKey = (code: string | undefined) => (code === "upcoming_bookings" ? "upcoming" : code === "staff_account" ? "staff" : "error");

async function errorCode(res: Response) {
  return ApiErrorBody.safeParse(await res.json().catch(() => null)).data?.error.code;
}

// Step 1 on the privacy page: email the confirmation link. Nothing is deleted yet.
export function DeleteAccount({ email }: { email: string }) {
  const t = useTranslations("account.privacy.delete");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string>();

  async function request() {
    setState("sending");
    setError(undefined);
    const res = await api.account.delete.$post();
    if (res.ok) return setState("sent");
    setState("idle");
    setError(t(errorKey(await errorCode(res))));
  }

  if (state === "sent") {
    return (
      <p role="status" className="rounded-lg bg-muted px-4 py-3 text-sm">
        {t("sent", { email })}
      </p>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="destructive-outline" onClick={request} loading={state === "sending"}>
        {state === "sending" ? t("sending") : t("button")}
      </Button>
      {error && <FieldError role="alert">{error}</FieldError>}
    </div>
  );
}

// Step 2, from the email link: delete for good. Afterwards the session is gone, so only the home page link remains.
export function ConfirmDelete({ token }: { token: string }) {
  const t = useTranslations("account.privacy.confirm");
  const tDelete = useTranslations("account.privacy.delete");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "deleting" | "done">("idle");
  const [error, setError] = useState<string>();

  async function confirm() {
    setState("deleting");
    setError(undefined);
    const res = await api.account.delete.confirm.$post({ json: { token } });
    if (res.ok) return setState("done");
    setState("idle");
    const code = await errorCode(res);
    if (code === "invalid_token" || code === "invalid_input") return setError(t("invalid"));
    setError(errorKey(code) === "error" ? t("error") : tDelete(errorKey(code)));
  }

  if (state === "done") {
    return (
      <div role="status" className="flex flex-col items-start gap-3">
        <h2 className="text-xl font-semibold">{t("doneTitle")}</h2>
        <p className="max-w-xl text-pretty text-muted-foreground">{t("doneBody")}</p>
        <Button asChild>
          {/* A full load: the shell around this page belongs to the deleted session. */}
          <a href={`/${locale}`}>{t("home")}</a>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="max-w-xl text-pretty">{t("body")}</p>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button variant="destructive" onClick={confirm} loading={state === "deleting"}>
          {state === "deleting" ? t("deleting") : t("button")}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/account/privacy">{t("back")}</Link>
        </Button>
      </div>
      {error && <FieldError role="alert">{error}</FieldError>}
    </div>
  );
}
