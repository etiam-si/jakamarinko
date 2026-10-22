import type { Attribution } from "@jakamarinko/api";
import { readConsent } from "./consent";
import { writeCookie } from "./cookie";

// Capturing runs on every landing, so it stays free of the api schemas (zod); getAttribution in utm.ts checks the
// cookie with them when a booking reads it back.
export const ATTRIBUTION_COOKIE = "jm_attribution";
const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"] as const;
// Fails to compile when Attribution gets a key this list doesn't have.
const allKeys: Record<Exclude<keyof Attribution, (typeof KEYS)[number]>, never> = {};
void allKeys;

// The cookie isn't strictly necessary (ePrivacy), so before marketing consent the source lives only in memory.
let pending: Attribution | null = null;

// On landing: a link with any utm_*, fbclid or gclid replaces what we had (last touch).
export function captureAttribution(search: string) {
  const params = new URLSearchParams(search);
  const found: Attribution = {};
  for (const key of KEYS) {
    const value = params.get(key);
    if (value) found[key] = value.slice(0, 500);
  }
  if (Object.keys(found).length === 0) return;
  pending = found;
  if (readConsent()?.marketing) storeAttribution();
}

// With marketing consent: keeps what this visit captured for 30 days.
export function storeAttribution() {
  if (pending) writeCookie(ATTRIBUTION_COOKIE, JSON.stringify(pending), 30);
  pending = null;
}
