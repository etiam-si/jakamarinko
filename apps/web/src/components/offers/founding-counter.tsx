"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { Founding, offerRules } from "@jakamarinko/api";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

async function fetchFounding() {
  const res = await api.offers.founding.$get();
  if (!res.ok) throw new Error(`founding: ${res.status}`);
  return Founding.parse(await res.json());
}

// "N of 20 founding places left", always counted from the database (no made-up urgency). Asked in the browser so
// the page itself stays static; the line keeps its height while loading, so nothing jumps. Nothing at 0 or when off.
export function FoundingCounter({ className }: { className?: string }) {
  const t = useTranslations("offers.founding");
  const { data } = useQuery({ queryKey: ["founding"], queryFn: fetchFounding, retry: false, staleTime: 60_000 });
  const show = !!data?.enabled && data.left > 0;
  return (
    <p className={cn("min-h-6 text-sm", className)} aria-live="polite">
      {show && (
        <span data-testid="founding-counter" className="inline-flex flex-wrap items-baseline gap-x-2 motion-safe:animate-in motion-safe:fade-in">
          <span className="font-semibold">{t("left", { left: data.left, places: data.places })}</span>
          <span className="text-muted-foreground">{t("offer", { percent: offerRules.foundingPercent })}</span>
        </span>
      )}
    </p>
  );
}
