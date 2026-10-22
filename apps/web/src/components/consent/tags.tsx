"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import type { TagsConfig } from "@jakamarinko/api";
import { setGoogleAds } from "@/lib/google-ads";
import { useConsent } from "./use-consent";

// The ids come from the api at runtime; with none set, nothing loads. Asked once per tab; a failure loads nothing.
// Plain fetch and the contract's type, not the api client and its zod schemas: this runs on every page, and those
// would cost a phone a long task for an answer our own api builds (apps/api/src/routes/events.ts).
let request: Promise<TagsConfig | null> | undefined;
function fetchConfig() {
  request ??= fetch("/api/events/config")
    .then(async (res) => {
      if (!res.ok) return null;
      const config = (await res.json()) as TagsConfig;
      setGoogleAds(config.googleAds);
      return config;
    })
    .catch(() => null);
  return request;
}

function useTagsConfig() {
  const [config, setConfig] = useState<TagsConfig | null>(null);
  useEffect(() => {
    let live = true;
    void fetchConfig().then((c) => live && setConfig(c));
    return () => {
      live = false;
    };
  }, []);
  return config;
}

const metaPixel = (id: string) =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(id)});fbq('track','PageView');`;

// One gtag.js for the Google tag and Google Ads: each id gets its own config line.
const googleTag = (ids: string[]) =>
  `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());${ids.map((id) => `gtag('config',${JSON.stringify(id)});`).join("")}`;

export function Tags() {
  const consent = useConsent();
  const config = useTagsConfig();
  if (!config || consent === undefined) return null;
  const marketing = consent?.marketing === true;
  const google = [config.googleTagId, config.googleAds?.id].filter((id): id is string => !!id);

  return (
    <>
      {/* Umami sets no cookies and stores nothing on the device, so it needs no consent and runs before the
          visitor chooses. It stays off once they decline analytics. */}
      {config.umami && consent?.analytics !== false && (
        <Script src={config.umami.src} data-website-id={config.umami.websiteId} strategy="afterInteractive" />
      )}
      {marketing && config.metaPixelId && <Script id="meta-pixel">{metaPixel(config.metaPixelId)}</Script>}
      {marketing && google.length > 0 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(google[0]!)}`} />
          <Script id="google-tag">{googleTag(google)}</Script>
        </>
      )}
    </>
  );
}
