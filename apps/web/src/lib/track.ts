import { type EventProps, metaEventNames, type TrackEvent } from "@jakamarinko/api";
import { readConsent } from "./consent";
import { getGoogleAds } from "./google-ads";

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventProps) => void };
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// Every conversion goes through here. A tag that isn't loaded (no id, no consent) is skipped.
// `eventId`: the id the api reports the same event with (Meta Conversions API, T14), so Meta counts it once.
export function track(event: TrackEvent, props: EventProps = {}, eventId: string = crypto.randomUUID()): string {
  window.umami?.track(event, props);
  if (readConsent()?.marketing) {
    window.fbq?.("track", metaEventNames[event], props, { eventID: eventId });
    window.gtag?.("event", event, props);
    const googleAds = getGoogleAds();
    const label = googleAds?.labels[event];
    if (googleAds && label) {
      window.gtag?.("event", "conversion", {
        send_to: `${googleAds.id}/${label}`,
        value: props.value,
        currency: props.currency,
        transaction_id: eventId,
      });
    }
  }
  return eventId;
}
