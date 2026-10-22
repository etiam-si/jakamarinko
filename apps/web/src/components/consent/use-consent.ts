import { useSyncExternalStore } from "react";
import { type Consent, readConsent, subscribeConsent } from "@/lib/consent";

// undefined while rendering on the server (the cookie is read in the browser), null until the visitor chooses.
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribeConsent, readConsent, () => undefined);
}
