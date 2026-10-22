"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { type Consent, onOpenConsentSettings, saveConsent } from "@/lib/consent";
import { useConsent } from "./use-consent";

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
          className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-2xl flex-col gap-3 rounded-t-2xl bg-popover px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[0.8125rem] leading-snug text-popover-foreground shadow-[0_-12px_32px_-12px_rgb(18_26_24/0.25)] ring-1 ring-foreground/10 duration-300 animate-in fade-in-0 slide-in-from-bottom-4 motion-reduce:animate-none sm:inset-x-4 sm:bottom-4 sm:gap-4 sm:rounded-xl sm:p-5 sm:text-sm sm:shadow-lg"
        >
          <p className="text-pretty">{t("banner.text")}</p>
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

function ConsentSettings({ initial, onClose }: { initial: Consent; onClose: () => void }) {
  const t = useTranslations("consent");
  const [choice, setChoice] = useState(initial);
  const save = (consent: Consent) => {
    saveConsent(consent);
    onClose();
  };
  const categories = ["analytics", "marketing"] as const;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>{t("settings.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Category id="consent-necessary" label={t("necessary.label")} description={t("necessary.description")}>
            <Checkbox id="consent-necessary" checked disabled />
          </Category>
          {categories.map((c) => (
            <Category key={c} id={`consent-${c}`} label={t(`${c}.label`)} description={t(`${c}.description`)}>
              <Checkbox
                id={`consent-${c}`}
                checked={choice[c]}
                onCheckedChange={(checked) => setChoice({ ...choice, [c]: checked === true })}
              />
            </Category>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => save(none)}>
            {t("rejectAll")}
          </Button>
          <Button variant="outline" onClick={() => save(choice)}>
            {t("settings.save")}
          </Button>
          <Button variant="outline" onClick={() => save(all)}>
            {t("acceptAll")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Category({ id, label, description, children }: { id: string; label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="pt-0.5">{children}</div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
