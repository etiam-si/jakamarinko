"use client";

import { MailCheck, UserRoundPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// After booking as a guest: one tap sends a sign-in link to the email the booking was made with, no retyping.
// Signing in with it creates the account, which already holds this booking, and lands on it.
export function CreateAccount({ email }: { email: string }) {
  const t = useTranslations("booking.confirmed.account");
  const signIn = useTranslations("auth.signIn");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function send() {
    setState("sending");
    const { authClient } = await import("@/lib/auth-client");
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: `/${locale}/sign-in/continue?next=${encodeURIComponent("/account")}`,
      errorCallbackURL: `/${locale}/sign-in`,
    });
    setState(error ? "failed" : "sent");
  }

  return (
    <section aria-labelledby="create-account" className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {state === "sent" ? <MailCheck aria-hidden className="size-5" /> : <UserRoundPlus aria-hidden className="size-5" />}
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="create-account" className="text-lg font-semibold text-balance">
            {state === "sent" ? signIn("checkTitle") : t("title")}
          </h2>
          <p role="status" className="text-pretty text-muted-foreground">
            {state === "sent"
              ? signIn.rich("checkBody", { email, b: (chunks) => <strong className="font-semibold text-foreground wrap-anywhere">{chunks}</strong> })
              : t("text", { email })}
          </p>
          {state === "failed" && <p className="text-sm font-medium text-destructive">{signIn("errors.generic")}</p>}
        </div>
      </div>
      {state !== "sent" && (
        <Button size="lg" className="w-full sm:w-auto sm:self-start" loading={state === "sending"} onClick={send}>
          {t("action")}
        </Button>
      )}
    </section>
  );
}
