"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { type Profile, ProfileInput } from "@jakamarinko/api";
import { locales, type Locale } from "@jakamarinko/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

type Errors = Partial<Record<"name" | "phone", string>>;

// Name, phone and language. A new language switches the site to it; the api moves upcoming booking emails too.
export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations("account.profile");
  const tLocale = useTranslations("common.localeSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [locale, setLocale] = useState<Locale>(profile.locale);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = ProfileInput.safeParse({ name, phone, locale });
    if (!parsed.success) {
      const fields = new Set(parsed.error.issues.map((i) => i.path[0]));
      setErrors({ name: fields.has("name") ? t("invalidName") : undefined, phone: fields.has("phone") ? t("invalidPhone") : undefined });
      return setStatus("idle");
    }
    setErrors({});
    setStatus("saving");
    const res = await api.account.profile.$put({ json: { name, phone, locale } });
    if (!res.ok) return setStatus("error");
    setStatus("saved");
    if (locale !== profile.locale) return router.replace(pathname, { locale });
    router.refresh();
  }

  return (
    <form onSubmit={save} noValidate className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" type="email" value={profile.email} readOnly disabled aria-describedby="email-hint" />
        <p id="email-hint" className="text-sm text-muted-foreground">
          {t("emailHint")}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={!!errors.phone}
          aria-describedby="phone-hint"
        />
        {errors.phone ? (
          <p className="text-sm text-destructive">{errors.phone}</p>
        ) : (
          <p id="phone-hint" className="text-sm text-muted-foreground">
            {t("phoneHint")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="locale">{t("language")}</Label>
        <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
          <SelectTrigger id="locale" className="w-56" aria-describedby="locale-hint">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locales.map((l) => (
              <SelectItem key={l} value={l}>
                {tLocale(l)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p id="locale-hint" className="text-sm text-muted-foreground">
          {t("languageHint")}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? t("saving") : t("save")}
        </Button>
        <p role="status" className="text-sm text-muted-foreground">
          {status === "saved" && t("saved")}
        </p>
      </div>
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {t("error")}
        </p>
      )}
    </form>
  );
}
