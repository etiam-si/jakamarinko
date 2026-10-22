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
        <section
          aria-label={t("banner.title")}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-2xl flex-col gap-4 rounded-xl bg-popover p-5 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        >
          <p>{t("banner.text")}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
              {t("banner.settings")}
            </Button>
            <Button variant="outline" onClick={() => saveConsent(none)}>
              {t("rejectAll")}
            </Button>
            <Button variant="outline" onClick={() => saveConsent(all)}>
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
