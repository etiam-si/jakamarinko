"use client";

import { MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
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
      <div className="flex flex-col items-center gap-4 text-center" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck aria-hidden className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-xl font-bold font-stretch-expanded">{t("checkTitle")}</h2>
          <p className="text-sm text-pretty text-muted-foreground">{t("checkBody", { email: sentTo })}</p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setSentTo(undefined)}>
          {t("differentEmail")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {google && (
        <>
          <Button variant="outline" size="lg" className="w-full" onClick={withGoogle}>
            {t("google")}
          </Button>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <form className="flex flex-col gap-5" onSubmit={sendLink} noValidate>
        <Field>
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "email-error" : undefined}
          />
          <FieldError id="email-error" role="alert">
            {error}
          </FieldError>
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? t("sending") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
