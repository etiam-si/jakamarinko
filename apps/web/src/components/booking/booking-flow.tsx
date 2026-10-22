"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { Service } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { track } from "@/lib/track";
import { getAttribution } from "@/lib/utm";
import { DetailsStep, type Details } from "./details-step";
import { healthAnswers } from "./health";
import { ReviewStep } from "./review-step";
import { ServiceStep } from "./service-step";
import { slotsKey, TimeStep, type Picked } from "./time-step";
import { Unavailable } from "./unavailable";

const steps = ["service", "time", "details", "review"] as const;
type Step = (typeof steps)[number];
type Query = { service?: string; start?: string; coach?: string; step?: Step };

// One page, one step at a time. The step, service and slot live in the URL, so the back button walks the steps;
// the details stay in memory only (health answers never go into a URL or the browser's storage).
export function BookingFlow({ services, prefill }: { services: Service[]; prefill: { name: string; email: string } | null }) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const service = services.find((s) => s.id === params.get("service"));
  const start = params.get("start");
  const coach = params.get("coach");
  const slot: Picked | null = start && coach ? { start, coachId: coach } : null;

  const [details, setDetails] = useState<Details>({
    name: prefill?.name ?? "",
    email: prefill?.email ?? "",
    phone: "",
    health: {},
    healthConsent: false,
    terms: false,
  });
  const [detailsDone, setDetailsDone] = useState(false);
  const [notice, setNotice] = useState<"slotTaken" | "unavailable" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // A step opens only when what it needs is there; a reload or an old link falls back to the first one missing.
  const requested = params.get("step");
  const step: Step = !service || requested === "service"
    ? "service"
    : !slot || requested === "time" || !requested
      ? "time"
      : requested === "review" && detailsDone
        ? "review"
        : "details";

  const go = (next: Step, query: Query = {}) => {
    const q = { service: service?.id, start: slot?.start, coach: slot?.coachId, ...query, step: next };
    const clean = Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined)) as Record<string, string>;
    router.push({ pathname: "/booking", query: clean });
  };

  const startedFor = useRef<string | null>(null);
  useEffect(() => {
    if (step === "time" && service && startedFor.current !== service.id) {
      startedFor.current = service.id;
      track("booking_started", { service: service.id });
    }
  }, [step, service]);

  // Screen readers and keyboards land on the new step's heading (not on the first render: the page has its own).
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef(step);
  useEffect(() => {
    if (shown.current === step) return;
    shown.current = step;
    heading.current?.focus();
  }, [step]);

  async function confirm() {
    if (!service || !slot) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const res = await api.booking.$post({
        json: {
          service: service.id,
          coachId: slot.coachId,
          start: slot.start,
          name: details.name.trim(),
          email: details.email.trim(),
          phone: details.phone.trim(),
          locale,
          ...(service.kind === "lab_test" && { healthAnswers: healthAnswers(details.health), healthConsent: true }),
          utm: getAttribution() ?? undefined,
        },
      });
      const status: number = res.status;
      if (status === 409) {
        setNotice("slotTaken");
        await queryClient.invalidateQueries({ queryKey: slotsKey(service.id) });
        go("time", { start: undefined, coach: undefined });
        return;
      }
      if (status !== 201) throw new Error(`booking failed: ${status}`);
      const { booking, manageUrl } = await res.json();
      // T13 moves this to after the payment.
      track("booking_paid", { service: service.id, value: service.priceCents / 100, currency: "EUR" });
      const token = new URL(manageUrl).searchParams.get("token") ?? "";
      router.replace({ pathname: `/booking/${booking.id}`, query: { token, confirmed: "1" } });
    } catch {
      setNotice("unavailable");
    } finally {
      setSubmitting(false);
    }
  }

  const index = steps.indexOf(step);
  return (
    <div className="flex flex-col gap-8">
      <ol aria-label={t("steps.label")} className="grid grid-cols-4 gap-2 text-xs sm:text-sm">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={s === step ? "step" : undefined}
            className={cn(
              "flex flex-col gap-1.5 border-t-4 pt-2",
              i <= index ? "border-primary" : "border-border text-muted-foreground",
              s === step && "font-semibold",
            )}
          >
            <span className="font-mono">{i + 1}</span>
            <span>{t(`steps.${s}`)}</span>
          </li>
        ))}
      </ol>

      <section aria-labelledby="booking-step" className="flex flex-col gap-6">
        <h2 id="booking-step" ref={heading} tabIndex={-1} className="font-heading text-2xl font-bold tracking-tight outline-none">
          {t(`${step}.heading`)}
        </h2>

        {notice === "slotTaken" && step === "time" && (
          <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4">
            {t("time.slotTaken")}
          </p>
        )}

        {step === "service" && (
          <ServiceStep services={services} initial={service?.id} onContinue={(id) => go("time", { service: id, start: undefined, coach: undefined })} />
        )}
        {step === "time" && service && (
          <TimeStep
            service={service}
            initial={slot}
            onChangeService={() => go("service")}
            onContinue={(picked) => {
              setNotice(null);
              go("details", { start: picked.start, coach: picked.coachId });
            }}
          />
        )}
        {step === "details" && service && (
          <DetailsStep
            service={service}
            value={details}
            onChange={setDetails}
            onBack={() => router.back()}
            onContinue={() => {
              setDetailsDone(true);
              go("review");
            }}
          />
        )}
        {step === "review" && service && slot && (
          <ReviewStep
            service={service}
            slot={slot}
            details={details}
            submitting={submitting}
            onEdit={(target) => go(target)}
            onConfirm={confirm}
          />
        )}
        {notice === "unavailable" && <Unavailable />}
      </section>
    </div>
  );
}
