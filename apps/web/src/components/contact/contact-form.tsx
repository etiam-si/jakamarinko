"use client";

import { CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CreateRequestInput, type RequestTopic } from "@jakamarinko/api";
import { type Locale, oneOffs, packages } from "@jakamarinko/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FormActions } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { track } from "@/lib/track";

const topics = ["coaching", "lab_test", "other"] as const satisfies RequestTopic[];
type Field = "name" | "email" | "phone" | "topic" | "message" | "consent";

// The coaching page links its package buttons to /contact?package=<id>: everything there is coaching.
function packageName(id: string | null, locale: Locale) {
  return [...packages, ...oneOffs].find((p) => p.id === id)?.name[locale];
}

// The contact form. The page is static, so the ?package= prefill happens after mount, and only into fields
// the visitor hasn't filled yet (they can start typing before the page is interactive).
export function ContactForm() {
  const t = useTranslations("requests.form");
  const locale = useLocale() as Locale;
  const [values, setValues] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [topic, setTopic] = useState<RequestTopic | "">("");
  useEffect(() => {
    const name = packageName(new URLSearchParams(window.location.search).get("package"), locale);
    if (!name) return;
    setTopic((v) => v || "coaching");
    setValues((v) => (v.message ? v : { ...v, message: `${t("packageLine", { name })}\n\n` }));
  }, [locale, t]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, true>>>({});
  const [failure, setFailure] = useState<"tooMany" | "generic">();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = CreateRequestInput.safeParse({ ...values, topic: topic || undefined, consent, locale });
    if (!parsed.success) {
      return setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], true])));
    }
    setErrors({});
    setFailure(undefined);
    setPending(true);
    const res = await api.requests.$post({ json: parsed.data }).catch(() => undefined);
    setPending(false);
    if (res?.status === 429) return setFailure("tooMany");
    if (!res?.ok) return setFailure("generic");
    // The api reports the same event to Meta under this id (with consent), so it is counted once.
    const body = (await res.json().catch(() => ({}))) as { eventId?: string };
    track("contact_sent", { topic: parsed.data.topic }, body.eventId);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-6 shadow-sm md:p-8" role="status">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CircleCheck aria-hidden className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-xl font-bold font-stretch-expanded">{t("success.title")}</h2>
          <p className="text-pretty text-muted-foreground">{t("success.body")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setValues((v) => ({ ...v, message: "" }));
            setSent(false);
          }}
        >
          {t("success.again")}
        </Button>
      </div>
    );
  }

  const error = (field: Field) =>
    errors[field] && <FieldError id={`contact-${field}-error`}>{t(`errors.${field}`)}</FieldError>;
  const invalid = (field: Field) => ({
    "aria-invalid": !!errors[field],
    "aria-describedby": errors[field] ? `contact-${field}-error` : undefined,
  });

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm sm:p-8"
      onSubmit={submit}
      noValidate
      aria-labelledby="contact-form-title"
    >
      <h2 id="contact-form-title" className="font-heading text-xl font-bold font-stretch-expanded md:text-2xl">
        {t("title")}
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="contact-name">{t("name")}</Label>
          <Input id="contact-name" autoComplete="name" value={values.name} onChange={set("name")} {...invalid("name")} />
          {error("name")}
        </Field>
        <Field>
          <Label htmlFor="contact-email">{t("email")}</Label>
          <Input id="contact-email" type="email" autoComplete="email" value={values.email} onChange={set("email")} {...invalid("email")} />
          {error("email")}
        </Field>
        <Field>
          <Label htmlFor="contact-phone">
            {t("phone")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
          </Label>
          <Input id="contact-phone" type="tel" autoComplete="tel" value={values.phone} onChange={set("phone")} {...invalid("phone")} />
          {error("phone")}
        </Field>
        <Field>
          <Label htmlFor="contact-topic">{t("topic")}</Label>
          <Select value={topic} onValueChange={(v) => setTopic(v as RequestTopic)}>
            <SelectTrigger id="contact-topic" className="w-full" {...invalid("topic")}>
              <SelectValue placeholder={t("topicPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {topics.map((key) => (
                <SelectItem key={key} value={key}>
                  {t(`topics.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error("topic")}
        </Field>
      </div>
      <Field>
        <Label htmlFor="contact-message">{t("message")}</Label>
        <Textarea id="contact-message" rows={6} className="min-h-36" placeholder={t("messagePlaceholder")} value={values.message} onChange={set("message")} {...invalid("message")} />
        {error("message")}
      </Field>
      {/* Honeypot: hidden from people and screen readers, bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">{t("website")}</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-3">
          <Checkbox id="contact-consent" className="mt-0.5" checked={consent} onCheckedChange={(v) => setConsent(v === true)} {...invalid("consent")} />
          <div className="flex flex-col gap-1">
            <Label htmlFor="contact-consent" className="font-normal">
              {t("consent")}
            </Label>
            <Link href="/legal/privacy" className="text-sm text-muted-foreground underline underline-offset-4">
              {t("privacy")}
            </Link>
          </div>
        </div>
        {error("consent")}
      </div>
      {failure && <FieldError role="alert">{t(`errors.${failure}`)}</FieldError>}
      <FormActions>
        <Button type="submit" size="lg" loading={pending}>
          {pending ? t("sending") : t("submit")}
        </Button>
      </FormActions>
    </form>
  );
}
