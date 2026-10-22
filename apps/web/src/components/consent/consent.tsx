"use client";

import { useEffect } from "react";
import { captureAttribution, storeAttribution } from "@/lib/utm";
import { ConsentBanner } from "./consent-banner";
import { Tags } from "./tags";
import { useConsent } from "./use-consent";

// Mounted once in the root layout: banner, settings, tags allowed by the choice, and the ad source of this landing.
export function Consent() {
  const marketing = useConsent()?.marketing === true;
  useEffect(() => captureAttribution(location.search), []);
  // Consent given later in the visit: store what the landing captured.
  useEffect(() => {
    if (marketing) storeAttribution();
  }, [marketing]);

  return (
    <>
      <ConsentBanner />
      <Tags />
    </>
  );
}
