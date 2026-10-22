"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type Consent, onOpenConsentSettings, saveConsent } from "@/lib/consent";
import { useConsent } from "./use-consent";

// The settings dialog (and its checkboxes) load only when someone opens it, not on every first visit.
const ConsentSettings = dynamic(() => import("./consent-settings"), { ssr: false });

const all: Consent = { analytics: true, marketing: true };
const none: Consent = { analytics: false, marketing: false };

// Shown until the visitor chooses. "Reject all" sits next to "Accept all", same size and style.
export function ConsentBanner() {
  const t = useTranslations("consent");
  const consent = useConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => onOpenConsentSettings(() => setSettingsOpen(true)), []);

  return (
    <>
      {consent === null && !settingsOpen && (
        // Phones: a compact sheet on the bottom edge, clear of the hero's headline and button and above the home bar.
        // From sm up: a floating card.
        <section
          aria-label={t("banner.title")}
          className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-2xl flex-col gap-3 rounded-t-2xl bg-popover px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[0.8125rem] leading-snug text-popover-foreground shadow-[0_-12px_32px_-12px_rgb(18_26_24/0.25)] ring-1 ring-foreground/10 sm:inset-x-4 sm:bottom-4 sm:gap-4 sm:rounded-xl sm:p-5 sm:text-sm sm:shadow-lg"
        >
          {/* Room for the lines the text takes with the web font, so the sheet doesn't grow when it arrives. */}
          <p className="min-h-[4lh] text-pretty max-[359px]:min-h-[5lh] sm:min-h-0 [:lang(sl)_&]:min-h-[5lh] max-[359px]:[:lang(sl)_&]:min-h-[6lh] sm:[:lang(sl)_&]:min-h-0">
            {t("banner.text")}
          </p>
          <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-[auto_1fr_1fr] sm:flex sm:justify-end">
            <Button variant="ghost" className="order-last col-span-2 h-11 px-3 min-[360px]:order-none min-[360px]:col-span-1 sm:h-10 sm:px-5" onClick={() => setSettingsOpen(true)}>
              {t("banner.settings")}
            </Button>
            <Button variant="outline" className="h-11 px-3 sm:h-10 sm:px-5" onClick={() => saveConsent(none)}>
              {t("rejectAll")}
            </Button>
            <Button variant="outline" className="h-11 px-3 sm:h-10 sm:px-5" onClick={() => saveConsent(all)}>
              {t("acceptAll")}
            </Button>
          </div>
        </section>
      )}
      {consent !== undefined && settingsOpen && (
        <ConsentSettings initial={consent ?? none} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
