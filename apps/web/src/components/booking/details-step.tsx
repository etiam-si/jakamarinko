"use client";

import type { Service } from "@jakamarinko/api";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { anyYes, healthComplete, healthQuestions, type HealthForm } from "./health";

export type Details = { name: string; email: string; phone: string; health: HealthForm; healthConsent: boolean; terms: boolean };
type Field = "name" | "email" | "phone" | "health" | "healthConsent" | "terms";

// The same limits as the api's CreateBookingInput.
const Contact = {
  name: z.string().trim().min(1).max(200),
  email: z.email().max(320),
  phone: z.string().trim().min(6).max(30),
};

function validate(d: Details, labTest: boolean): Field[] {
  const bad: Field[] = [];
  if (!Contact.name.safeParse(d.name).success) bad.push("name");
  if (!Contact.email.safeParse(d.email.trim()).success) bad.push("email");
  if (!Contact.phone.safeParse(d.phone).success) bad.push("phone");
  if (labTest && !healthComplete(d.health)) bad.push("health");
  if (labTest && !d.healthConsent) bad.push("healthConsent");
  if (!d.terms) bad.push("terms");
  return bad;
}

const link = (href: string) => (chunks: React.ReactNode) => (
  <Link href={href} target="_blank" className="text-primary underline underline-offset-4">
    {chunks}
  </Link>
);

export function DetailsStep({
  service,
  value: d,
  onChange,
  onBack,
  onContinue,
}: {
  service: Service;
  value: Details;
  onChange: (d: Details) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const t = useTranslations("booking");
  const labTest = service.kind === "lab_test";
  // After the first try, the messages follow the fields as they get fixed.
  const [tried, setTried] = useState(false);
  const errors = tried ? validate(d, labTest) : [];
  const form = useRef<HTMLFormElement>(null);
  const set = (patch: Partial<Details>) => onChange({ ...d, ...patch });
  const invalid = (f: Field) => errors.includes(f);
  // aria-invalid and the message's id for a field that failed.
  const described = (f: Field) => (invalid(f) ? { "aria-invalid": true, "aria-describedby": `${f}-error` } : {});
  const error = (f: Field) =>
    invalid(f) && (
      <p id={`${f}-error`} className="text-sm text-destructive">
        {t(`details.errors.${f}`)}
      </p>
    );

  return (
    <form
      ref={form}
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (validate(d, labTest).length === 0) return onContinue();
        // The first field to fix gets the focus; its message is tied to it.
        requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("details.name")}</Label>
        <Input id="name" autoComplete="name" value={d.name} onChange={(e) => set({ name: e.target.value })} {...described("name")} />
        {error("name")}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("details.email")}</Label>
        <Input id="email" type="email" autoComplete="email" value={d.email} onChange={(e) => set({ email: e.target.value })} {...described("email")} />
        {error("email")}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">{t("details.phone")}</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          value={d.phone}
          onChange={(e) => set({ phone: e.target.value })}
          aria-invalid={invalid("phone") || undefined}
          aria-describedby={invalid("phone") ? "phone-hint phone-error" : "phone-hint"}
        />
        <p id="phone-hint" className="text-sm text-muted-foreground">
          {t("details.phoneHint")}
        </p>
        {error("phone")}
      </div>

      {labTest && <HealthQuestions value={d.health} onChange={(health) => set({ health })} invalid={invalid("health")} />}
      {error("health")}

      <div className="flex flex-col gap-4">
        {labTest && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="healthConsent"
                checked={d.healthConsent}
                onCheckedChange={(c) => set({ healthConsent: c === true })}
                className="mt-1"
                {...described("healthConsent")}
              />
              <Label htmlFor="healthConsent" className="leading-snug font-normal">
                <span>{t.rich("details.healthConsent", { privacy: link("/legal/privacy") })}</span>
              </Label>
            </div>
            {error("healthConsent")}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Checkbox id="terms" checked={d.terms} onCheckedChange={(c) => set({ terms: c === true })} className="mt-1" {...described("terms")} />
            <Label htmlFor="terms" className="leading-snug font-normal">
              <span>{t.rich("details.terms", { terms: link("/legal/terms") })}</span>
            </Label>
          </div>
          {error("terms")}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          {t("back")}
        </Button>
        <Button type="submit" size="lg">
          {t("continue")}
        </Button>
      </div>
    </form>
  );
}

function HealthQuestions({ value, onChange, invalid }: { value: HealthForm; onChange: (h: HealthForm) => void; invalid: boolean }) {
  const t = useTranslations("booking.health");
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4" aria-describedby={invalid ? "health-error" : undefined}>
      <legend className="px-1 text-lg font-semibold">{t("heading")}</legend>
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      {healthQuestions.map((q) => (
        <fieldset key={q} className="flex flex-col gap-2 border-t border-border pt-4">
          <legend className="float-left mb-2">{t(`questions.${q}`)}</legend>
          <div className="clear-both flex gap-6">
            {(["yes", "no"] as const).map((a) => (
              <label key={a} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={q}
                  value={a}
                  checked={value[q] === (a === "yes")}
                  onChange={() => onChange({ ...value, [q]: a === "yes" })}
                  aria-invalid={(invalid && value[q] === undefined) || undefined}
                  className="size-4 accent-primary"
                />
                {t(a)}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {anyYes(value) && (
        <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4">
          {t("doctorNote")}
        </p>
      )}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <Label htmlFor="health-other">{t("other")}</Label>
        <Textarea id="health-other" maxLength={500} value={value.other ?? ""} onChange={(e) => onChange({ ...value, other: e.target.value })} />
      </div>
    </fieldset>
  );
}
