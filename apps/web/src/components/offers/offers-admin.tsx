"use client";

import { offerRules, OfferCode, type DiscountType, type Founding, type Service } from "@jakamarinko/api";
import { locales, type Locale } from "@jakamarinko/types";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { NativeSelect } from "./native-select";

export type ServiceOption = { id: Service["id"]; name: string };

function Panel({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {lead && <p className="text-sm text-muted-foreground">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

// The end of a Ljubljana calendar day as an instant, so "valid until 31 Dec" includes the 31st.
function endOfLocalDay(date: string) {
  const guess = new Date(`${date}T23:59:59Z`);
  const wall = (zone: string) => new Date(guess.toLocaleString("en-US", { timeZone: zone })).getTime();
  return new Date(guess.getTime() - (wall("Europe/Ljubljana") - wall("UTC"))).toISOString();
}

export function FreeTestForm({ services }: { services: ServiceOption[] }) {
  const t = useTranslations("offers.coach.freeTest");
  const tLocale = useTranslations("common.localeSwitcher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState<Service["id"]>(services.find((s) => s.id === "lactate-profile")?.id ?? services[0]!.id);
  const [language, setLanguage] = useState<Locale>(useLocale() as Locale);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.offers["free-test"].$post({ json: { name, email, service, locale: language } });
      if (!res.ok) throw new Error(String(res.status));
      toast.success(t("sent", { email }));
      setName("");
      setEmail("");
      router.refresh();
    } catch {
      toast.error(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={t("title")} lead={t("lead")}>
      <form onSubmit={send} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <Label htmlFor="free-name">{t("name")}</Label>
            <Input id="free-name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="free-email">{t("email")}</Label>
            <Input id="free-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="free-service">{t("service")}</Label>
            <NativeSelect id="free-service" value={service} onChange={(e) => setService(e.target.value as Service["id"])}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <Label htmlFor="free-language">{t("language")}</Label>
            <NativeSelect id="free-language" value={language} onChange={(e) => setLanguage(e.target.value as Locale)}>
              {locales.map((l) => (
                <option key={l} value={l}>
                  {tLocale(l)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Button type="submit" size="lg" loading={busy} className="self-start">
          {t("submit")}
        </Button>
      </form>
    </Panel>
  );
}

export function NewCodeForm({ services }: { services: ServiceOption[] }) {
  const t = useTranslations("offers.coach.newCode");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<DiscountType>("percent");
  const [value, setValue] = useState("");
  const [only, setOnly] = useState<Service["id"][]>([]);
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const number = Number(value.replace(",", "."));
    try {
      const res = await api.offers.codes.$post({
        json: {
          code: code.trim() || undefined,
          discountType: type,
          value: type === "free" ? 0 : type === "fixed" ? Math.round(number * 100) : Math.round(number),
          services: only.length ? only : null,
          maxUses: maxUses ? Number(maxUses) : null,
          expiresAt: expires ? endOfLocalDay(expires) : null,
          email: email.trim() || null,
          note: note.trim() || null,
        },
      });
      const status: number = res.status;
      if (status === 409) return setError(t("taken"));
      if (status === 400) {
        const body = (await res.json()) as { error?: { message?: string } };
        const fields = (body.error?.message ?? "").split("; ").map((m) => m.split(":")[0]);
        return setError(t("invalid", { fields: fields.join(", ") }));
      }
      if (!res.ok) throw new Error(String(status));
      const created = OfferCode.parse(await res.json());
      toast.success(t("created", { code: created.code }));
      setCode("");
      setValue("");
      setOnly([]);
      setMaxUses("");
      setExpires("");
      setEmail("");
      setNote("");
      router.refresh();
    } catch {
      setError(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={t("title")}>
      <form onSubmit={create} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <Label htmlFor="code-code">{t("code")}</Label>
            <Input
              id="code-code"
              value={code}
              maxLength={32}
              pattern="[A-Za-z0-9\-]{4,32}"
              className="uppercase"
              onChange={(e) => setCode(e.target.value)}
              aria-describedby="code-code-hint"
            />
            <FieldHint id="code-code-hint">{t("codeHint")}</FieldHint>
          </Field>
          <Field>
            <Label htmlFor="code-type">{t("type")}</Label>
            <NativeSelect id="code-type" value={type} onChange={(e) => setType(e.target.value as DiscountType)}>
              {(["percent", "fixed", "free"] as const).map((d) => (
                <option key={d} value={d}>
                  {t(`types.${d}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {type !== "free" && (
            <Field>
              <Label htmlFor="code-value">{type === "percent" ? t("percent") : t("euros")}</Label>
              <Input
                id="code-value"
                required
                inputMode="decimal"
                type="number"
                min={type === "percent" ? 1 : 0.01}
                max={type === "percent" ? 100 : 10000}
                step={type === "percent" ? 1 : 0.01}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
          )}
          <Field>
            <Label htmlFor="code-max">{t("maxUses")}</Label>
            <Input id="code-max" type="number" min={1} step={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} aria-describedby="code-max-hint" />
            <FieldHint id="code-max-hint">{t("maxUsesHint")}</FieldHint>
          </Field>
          <Field>
            <Label htmlFor="code-expires">{t("expires")}</Label>
            <Input id="code-expires" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="code-email">{t("email")}</Label>
            <Input id="code-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t("services")}</legend>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox checked={only.length === 0} onCheckedChange={() => setOnly([])} />
            {t("allServices")}
          </label>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {services.map((s) => (
              <label key={s.id} className="flex min-h-11 items-center gap-3 text-sm">
                <Checkbox
                  checked={only.includes(s.id)}
                  onCheckedChange={(on) => setOnly((list) => (on ? [...list, s.id] : list.filter((x) => x !== s.id)))}
                />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
        <Field>
          <Label htmlFor="code-note">{t("note")}</Label>
          <Input id="code-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {error && <FieldError role="alert">{error}</FieldError>}
        <Button type="submit" size="lg" loading={busy} className="self-start">
          {t("submit")}
        </Button>
      </form>
    </Panel>
  );
}

export function GiftForm({ services }: { services: ServiceOption[] }) {
  const t = useTranslations("offers.coach.gift");
  const router = useRouter();
  const [kind, setKind] = useState<"service" | "amount">("service");
  const [service, setService] = useState<Service["id"]>(services.find((s) => s.id === "lactate-profile")?.id ?? services[0]!.id);
  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const value = kind === "service" ? { service } : { amountCents: Math.round(Number(amount.replace(",", ".")) * 100) };
      const res = await api.offers.gifts.$post({ json: { ...value, recipientName: recipientName.trim() || undefined } });
      if (!res.ok) throw new Error(String(res.status));
      const code = OfferCode.parse(await res.json()).code;
      setCreated(code);
      toast.success(t("created", { code }));
      setRecipientName("");
      router.refresh();
    } catch {
      toast.error(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={t("title")} lead={t("lead")}>
      <form onSubmit={create} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <Label htmlFor="gift-kind">{t("kind")}</Label>
            <NativeSelect id="gift-kind" value={kind} onChange={(e) => setKind(e.target.value as "service" | "amount")}>
              <option value="service">{t("byService")}</option>
              <option value="amount">{t("byAmount")}</option>
            </NativeSelect>
          </Field>
          {kind === "service" ? (
            <Field>
              <Label htmlFor="gift-service">{t("byService")}</Label>
              <NativeSelect id="gift-service" value={service} onChange={(e) => setService(e.target.value as Service["id"])}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ) : (
            <Field>
              <Label htmlFor="gift-amount">{t("amount")}</Label>
              <Input id="gift-amount" type="number" required min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          )}
          <Field>
            <Label htmlFor="gift-recipient">{t("recipient")}</Label>
            <Input id="gift-recipient" maxLength={200} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" loading={busy}>
            {t("submit")}
          </Button>
          {created && (
            <Link href={`/gift/${created}`} className="text-sm font-medium text-primary underline underline-offset-4" target="_blank">
              {t("open")}
            </Link>
          )}
        </div>
      </form>
    </Panel>
  );
}

export function FoundingPanel({ founding, canSwitch }: { founding: Founding; canSwitch: boolean }) {
  const t = useTranslations("offers.coach.founding");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await api.offers.founding.$put({ json: { enabled: !founding.enabled } });
      if (!res.ok) throw new Error(String(res.status));
      router.refresh();
    } catch {
      toast.error(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={t("title")}>
      <p className="text-2xl font-bold tabular-nums" data-testid="founding-status">
        {t("status", { taken: founding.taken, places: founding.places })}
      </p>
      <p className="text-sm text-muted-foreground">{founding.enabled ? t("on", { percent: offerRules.foundingPercent }) : t("off")}</p>
      {canSwitch && (
        <Button type="button" size="lg" variant="outline" loading={busy} onClick={toggle} className="self-start">
          {founding.enabled ? t("switchOff") : t("switchOn")}
        </Button>
      )}
    </Panel>
  );
}
