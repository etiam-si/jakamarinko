"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/utm";
import { ConsentBanner } from "./consent-banner";
import { Tags } from "./tags";

// Mounted once in the root layout: banner, settings, tags allowed by the choice, and the ad source of this landing.
export function Consent() {
  useEffect(() => captureAttribution(location.search), []);
  return (
    <>
      <ConsentBanner />
      <Tags />
    </>
  );
}
