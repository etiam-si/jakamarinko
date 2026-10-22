"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { ConsentBanner } from "./consent-banner";
import { useConsent } from "./use-consent";

// The tags and the ad source load after the page is interactive: they bring the api schemas, which no page
// needs for its first paint.
const Tags = dynamic(() => import("./tags").then((m) => m.Tags), { ssr: false });
const utm = () => import("@/lib/utm");

// Mounted once in the root layout: banner, settings, tags allowed by the choice, and the ad source of this landing.
export function Consent() {
  const marketing = useConsent()?.marketing === true;
  useEffect(() => {
    void utm().then((m) => m.captureAttribution(location.search));
  }, []);
  // Consent given later in the visit: store what the landing captured.
  useEffect(() => {
    if (marketing) void utm().then((m) => m.storeAttribution());
  }, [marketing]);

  return (
    <>
      <ConsentBanner />
      <Tags />
    </>
  );
}
