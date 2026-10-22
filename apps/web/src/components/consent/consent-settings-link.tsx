"use client";

import { useTranslations } from "next-intl";
import { openConsentSettings } from "@/lib/consent";

// For the footer (T08): reopens the cookie settings.
export function ConsentSettingsLink({ className }: { className?: string }) {
  const t = useTranslations("consent");
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      {t("link")}
    </button>
  );
}
