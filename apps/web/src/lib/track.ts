import type { EventProps, TrackEvent } from "@jakamarinko/api";
import { readConsent } from "./consent";

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventProps) => void };
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const metaEvents: Record<TrackEvent, string> = {
  booking_started: "InitiateCheckout",
  booking_paid: "Purchase",
  package_started: "Subscribe",
  contact_sent: "Contact",
  lead_signup: "Lead",
};

// Every conversion goes through here. A tag that isn't loaded (no id, no consent) is skipped.
// Returns the event id, so a server-side copy (T14) can be deduplicated by Meta.
export function track(event: TrackEvent, props: EventProps = {}): string {
  const eventId = crypto.randomUUID();
  window.umami?.track(event, props);
  if (readConsent()?.marketing) {
    window.fbq?.("track", metaEvents[event], props, { eventID: eventId });
    window.gtag?.("event", event, props);
  }
  return eventId;
}
