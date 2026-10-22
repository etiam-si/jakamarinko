import type { EventProps, TrackEvent } from "@jakamarinko/api";
import type { BookingConfig } from "../booking/config";
import { tagsConfig } from "../routes/events";

// A conversion counted on the server, where it can't be blocked or lost when the customer closes the tab.
// Umami is cookieless, so it needs no consent; without UMAMI_URL it is a no-op. Meta Conversions API joins here (T14).
// Never pass anything that identifies a person or health data: this goes to a third party.
export async function trackServer(event: TrackEvent, props: EventProps, config: BookingConfig, locale: string) {
  const umami = tagsConfig().umami;
  if (!umami) return;
  const site = new URL(config.siteUrl);
  try {
    const res = await fetch(umami.src.replace(/script\.js$/, "api/send"), {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 (compatible; jakamarinko-api)" },
      body: JSON.stringify({
        type: "event",
        payload: { website: umami.websiteId, hostname: site.hostname, url: `/${locale}/booking`, language: locale, name: event, data: props },
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) console.warn(`umami ${event}: ${res.status}`);
  } catch (err) {
    console.warn(`umami ${event}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
