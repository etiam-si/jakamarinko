import { useSyncExternalStore } from "react";
import { type Consent, readConsent, subscribeConsent } from "@/lib/consent";

// null until the visitor chooses. The server (and hydration) renders as if nobody chose yet, so the banner is in the
// HTML and paints with the page instead of popping in after the script; ConsentScript hides it at once for visitors
// who already chose.
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribeConsent, readConsent, () => null);
}
