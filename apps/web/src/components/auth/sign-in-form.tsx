"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type Props = { google: boolean; next?: string; error?: "linkExpired" | "generic" };

const Email = z.email();

export function SignInForm({ google, next, error: initialError }: Props) {
  const t = useTranslations("auth.signIn");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError && t(`errors.${initialError}`));

  // Better Auth redirects to these after the link or Google; the continue page decides where to go from there.
  const callbacks = {
    callbackURL: `/${locale}/sign-in/continue${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    errorCallbackURL: `/${locale}/sign-in`,
  };

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Email.safeParse(email.trim());
    if (!parsed.success) return setError(t("invalidEmail"));
    setPending(true);
    setError(undefined);
    const { error } = await authClient.signIn.magicLink({ email: parsed.data, ...callbacks });
    setPending(false);
    if (error) setError(t("errors.generic"));
    else setSentTo(parsed.data);
  }

  async function withGoogle() {
    setError(undefined);
    const { error } = await authClient.signIn.social({ provider: "google", ...callbacks });
    if (error) setError(t("errors.generic"));
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <h2 className="text-xl font-semibold">{t("checkTitle")}</h2>
        <p className="text-muted-foreground">{t("checkBody", { email: sentTo })}</p>
        <Button variant="outline" onClick={() => setSentTo(undefined)}>
          {t("differentEmail")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {google && (
        <>
          <Button variant="outline" size="lg" onClick={withGoogle}>
            {t("google")}
          </Button>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <form className="flex flex-col gap-3" onSubmit={sendLink} noValidate>
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("sending") : t("submit")}
        </Button>
      </form>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
