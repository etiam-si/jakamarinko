"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Founding = { enabled: boolean; places: number; left: number };

// Plain fetch and a shape check, no react-query, zod or api client: this sits in the hero of the public pages, where
// every kilobyte of script delays the first paint of the photo (US-009).
async function fetchFounding(): Promise<Founding | null> {
  try {
    const res = await fetch("/api/offers/founding");
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (typeof data !== "object" || data === null) return null;
    const { enabled, places, left } = data as Record<string, unknown>;
    if (typeof enabled !== "boolean" || typeof places !== "number" || typeof left !== "number") return null;
    return { enabled, places, left };
  } catch {
    return null;
  }
}

// "N of 20 founding places left", always counted from the database (no made-up urgency). Asked in the browser so
// the page itself stays static; the line keeps its height while loading, so nothing jumps. Nothing at 0 or when off.
// `percent`: the founding discount (offerRules.foundingPercent), passed in by the server page.
export function FoundingCounter({ percent, className }: { percent: number; className?: string }) {
  const t = useTranslations("offers.founding");
  const [data, setData] = useState<Founding | null>(null);
  useEffect(() => {
    let live = true;
    fetchFounding().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, []);
  const show = !!data?.enabled && data.left > 0;
  return (
    <p className={cn("min-h-6 text-sm", className)} aria-live="polite">
      {show && (
        <span data-testid="founding-counter" className="inline-flex flex-wrap items-baseline gap-x-2 motion-safe:animate-in motion-safe:fade-in">
          <span className="font-semibold">{t("left", { left: data.left, places: data.places })}</span>
          <span className="text-muted-foreground">{t("offer", { percent })}</span>
        </span>
      )}
    </p>
  );
}
