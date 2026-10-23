"use client";

import { cn } from "cn";
import { ExternalLink, MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { webmail } from "./webmail";

type Props = { google: boolean; next?: string; error?: "linkExpired" | "generic" };

const Email = z.email();
// How long "Resend" waits after a link went out, so a second click doesn't send two links at once.
export const resendCooldown = 30;
const title = "font-heading text-3xl font-bold tracking-tight text-balance font-stretch-expanded sm:text-4xl";

export function SignInForm({ google, next, error: initialError }: Props) {
  const t = useTranslations("auth.signIn");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError && t(`errors.${initialError}`));
  const input = useRef<HTMLInputElement>(null);

  // Better Auth redirects to these after the link or Google; the continue page decides where to go from there.
  const callbacks = {
    callbackURL: `/${locale}/sign-in/continue${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    errorCallbackURL: `/${locale}/sign-in`,
  };

  const send = async (to: string) => (await authClient.signIn.magicLink({ email: to, ...callbacks })).error;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Email.safeParse(email.trim());
    if (!parsed.success) {
      setError(t("invalidEmail"));
      return input.current?.focus();
    }
    setPending(true);
    setError(undefined);
    const failed = await send(parsed.data);
    setPending(false);
    if (failed) setError(t("errors.generic"));
    else setSentTo(parsed.data);
  }

  async function withGoogle() {
    setError(undefined);
    const { error } = await authClient.signIn.social({ provider: "google", ...callbacks });
    if (error) setError(t("errors.generic"));
  }

  if (sentTo) {
    return (
      <Sent
        email={sentTo}
        resend={() => send(sentTo)}
        onDifferentEmail={() => {
          setSentTo(undefined);
          requestAnimationFrame(() => input.current?.focus());
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className={title}>{t("title")}</h1>
        <p className="text-pretty text-muted-foreground">{t("intro")}</p>
      </div>
      <div className="flex flex-col gap-5">
        {google && (
          <>
            <Button variant="outline" size="lg" className="w-full gap-3 bg-card" onClick={withGoogle}>
              <GoogleMark />
              {t("google")}
            </Button>
            <div className="flex items-center gap-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
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
              ref={input}
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="send"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "email-error" : undefined}
              className="h-12"
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
    </div>
  );
}

// After the link went out: where it went, what to do, and a way to send it again once the cooldown has run out.
function Sent({ email, resend, onDifferentEmail }: { email: string; resend: () => Promise<unknown>; onDifferentEmail: () => void }) {
  const t = useTranslations("auth.signIn");
  const [until, setUntil] = useState(() => Date.now() + resendCooldown * 1000);
  const [now, setNow] = useState(() => Date.now());
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  const inbox = webmail(email);
  // Keyboards and screen readers continue from the new heading, not from the form that just went away.
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  useEffect(() => {
    if (left === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [left]);

  async function again() {
    setState("sending");
    const failed = await resend();
    setState(failed ? "failed" : "sent");
    if (!failed) {
      setUntil(Date.now() + resendCooldown * 1000);
      setNow(Date.now());
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="status" className="flex flex-col gap-5">
        <span className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <MailCheck aria-hidden className="size-6" />
          <span aria-hidden className="absolute -top-1 -right-1 size-3 rounded-full bg-signal ring-4 ring-background" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 ref={heading} tabIndex={-1} className={cn(title, "outline-none")}>
            {t("checkTitle")}
          </h1>
          {/* The address on a line of its own, so a long one never breaks mid-sentence. */}
          <p className="text-pretty text-muted-foreground">{t("checkTo")}</p>
          <p className="rounded-lg border bg-card px-3 py-2 font-semibold text-foreground wrap-anywhere">{email}</p>
          <p className="text-pretty text-muted-foreground">{t("checkHow")}</p>
        </div>
      </div>
      <p
        aria-live="polite"
        className={cn(
          "rounded-lg px-4 py-3 text-sm text-pretty",
          state === "sent" ? "bg-success/10 text-success" : state === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
        )}
      >
        {state === "sent" ? t("resent") : state === "failed" ? t("errors.generic") : t("spamHint")}
      </p>
      <div className="flex flex-col gap-2">
        {inbox && (
          <Button asChild size="lg" className="w-full">
            <a href={inbox.url} target="_blank" rel="noopener noreferrer">
              {t("openMail", { provider: inbox.name })}
              <ExternalLink aria-hidden />
            </a>
          </Button>
        )}
        <Button variant="outline" size="lg" className="w-full tabular-nums" disabled={left > 0} loading={state === "sending"} onClick={again}>
          {left > 0 ? t("resendIn", { seconds: left }) : t("resend")}
        </Button>
        <Button variant="link" className="h-11 self-center" onClick={onDifferentEmail}>
          {t("differentEmail")}
        </Button>
      </div>
    </div>
  );
}

// Google's "G", in its own colours, as Google's sign-in guidelines ask.
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
