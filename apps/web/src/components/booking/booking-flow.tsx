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
import { checkoutUrl } from "./payment/payment";
import { ReviewStep } from "./review-step";
import { ServiceStep } from "./service-step";
import { slotsKey, TimeStep, type Picked } from "./time-step";
import { Unavailable } from "./unavailable";

const steps = ["service", "time", "details", "review"] as const;
type Step = (typeof steps)[number];
type Query = { service?: string; start?: string; coach?: string; step?: Step };

// One page, one step at a time. The step, service and slot live in the URL, so the back button walks the steps;
// the details stay in memory only (health answers never go into a URL or the browser's storage).
export function BookingFlow({
  services,
  prefill,
  preparation,
}: {
  services: Service[];
  prefill: { name: string; email: string } | null;
  // How to prepare, per service id. From the catalog on the server, so the page does not ship the catalog.
  preparation: Record<string, string[]>;
}) {
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

  // Where the flow loses people: each step reached goes to the anonymous visit statistics only (never to the ad
  // tags, never anything from the form).
  useEffect(() => {
    if (step !== "service" && service) window.umami?.track("booking_step", { step, service: service.id });
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
      const token = new URL(manageUrl).searchParams.get("token") ?? "";
      // Paid online: on to Stripe. The api counts booking_paid when the payment arrives; if Stripe can't be
      // opened, the booking page offers it again.
      if (booking.status === "pending_payment") {
        const url = await checkoutUrl(booking.id, token);
        if (url && url !== "expired") {
          window.umami?.track("booking_step", { step: "checkout", service: service.id });
          return window.location.assign(url);
        }
        return router.replace({ pathname: `/booking/${booking.id}`, query: { token } });
      }
      // The event id is the one the api reports to Meta, so the two copies count once.
      track("booking_paid", { service: service.id, value: service.priceCents / 100, currency: "EUR" }, `booking_paid-${booking.id}`);
      router.replace({ pathname: `/booking/${booking.id}`, query: { token, confirmed: "1" } });
    } catch {
      setNotice("unavailable");
    } finally {
      setSubmitting(false);
    }
  }

  const index = steps.indexOf(step);
  // Which way the step changed, so the new one slides in from the side it comes from.
  const lastIndex = useRef(index);
  const forward = index >= lastIndex.current;
  useEffect(() => {
    lastIndex.current = index;
  }, [index]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p aria-hidden className="flex items-center justify-between gap-3 font-mono text-xs tracking-wider text-muted-foreground uppercase sm:hidden">
          <span>{t("steps.progress", { current: index + 1, total: steps.length })}</span>
          <span className="truncate text-foreground">{t(`steps.${step}`)}</span>
        </p>
        <ol aria-label={t("steps.label")} className="grid grid-cols-4 gap-1.5 sm:gap-3">
          {steps.map((s, i) => (
            <li
              key={s}
              aria-current={s === step ? "step" : undefined}
              aria-label={s === step ? t("steps.progressNamed", { current: i + 1, total: steps.length, name: t(`steps.${s}`) }) : undefined}
              className={cn("flex flex-col gap-2.5 text-sm", i > index && "text-muted-foreground")}
            >
              <span aria-hidden className="relative h-1 overflow-hidden rounded-full bg-border">
                <span
                  className={cn(
                    "absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none",
                    i <= index ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </span>
              <span className="max-sm:sr-only flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs tabular-nums transition-colors duration-300 motion-reduce:transition-none",
                    i < index ? "bg-primary/15 text-primary" : i === index ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {i + 1}
                </span>
                <span className={cn("leading-tight", s === step && "font-semibold")}>{t(`steps.${s}`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <section
        key={step}
        aria-labelledby="booking-step"
        className={cn(
          "flex flex-col gap-6 duration-300 ease-out animate-in fade-in-0 motion-reduce:animate-none",
          forward ? "slide-in-from-right-3" : "slide-in-from-left-3",
        )}
      >
        <h2 id="booking-step" ref={heading} tabIndex={-1} className="font-heading text-xl font-bold tracking-tight font-stretch-expanded outline-none md:text-2xl">
          {t(`${step}.heading`)}
        </h2>

        {notice === "slotTaken" && step === "time" && (
          <p role="alert" className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
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
            preparation={preparation[service.id] ?? []}
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
