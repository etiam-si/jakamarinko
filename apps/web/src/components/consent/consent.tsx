"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ConsentBanner } from "./consent-banner";
import { useConsent } from "./use-consent";

// The tags and the ad source wait until the page has loaded and the browser is idle (like next/script's lazyOnload):
// nothing on screen needs them.
const Tags = dynamic(() => import("./tags").then((m) => m.Tags), { ssr: false });
const utm = () => import("@/lib/utm-capture");

function afterLoad(run: () => void) {
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(run, { timeout: 3000 }) : setTimeout(run, 200));
  if (document.readyState === "complete") idle();
  else addEventListener("load", idle, { once: true });
}

// Mounted once in the root layout: banner, settings, tags allowed by the choice, and the ad source of this landing.
export function Consent() {
  const marketing = useConsent()?.marketing === true;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const search = location.search;
    afterLoad(() => {
      setLoaded(true);
      void utm().then((m) => m.captureAttribution(search));
    });
  }, []);
  // Consent given later in the visit: store what the landing captured.
  useEffect(() => {
    if (marketing && loaded) void utm().then((m) => m.storeAttribution());
  }, [marketing, loaded]);

  return (
    <>
      <div data-consent-banner>
        <ConsentBanner />
      </div>
      {loaded && <Tags />}
    </>
  );
}
