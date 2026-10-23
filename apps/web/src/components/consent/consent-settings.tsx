"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { type Consent, saveConsent } from "@/lib/consent";

const all: Consent = { analytics: true, marketing: true };
const none: Consent = { analytics: false, marketing: false };

// The choice per category. Its own file: the banner loads it only when someone opens the settings.
export default function ConsentSettings({ initial, onClose }: { initial: Consent; onClose: () => void }) {
  const t = useTranslations("consent");
  const [choice, setChoice] = useState(initial);
  const save = (consent: Consent) => {
    saveConsent(consent);
    onClose();
  };
  const categories = ["analytics", "marketing"] as const;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
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
        {/* The choice stays in reach while the text scrolls on a small phone. */}
        <DialogFooter className="sticky -bottom-6 -mx-6 -mb-6 border-t bg-popover px-6 pt-3 pb-6">
          <Button variant="outline" className="max-sm:h-11" onClick={() => save(none)}>
            {t("rejectAll")}
          </Button>
          <Button className="max-sm:h-11" onClick={() => save(choice)}>
            {t("settings.save")}
          </Button>
          <Button variant="outline" className="max-sm:h-11" onClick={() => save(all)}>
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
