import { Attribution } from "@jakamarinko/api";
import { readConsent } from "./consent";
import { readCookie, writeCookie } from "./cookie";

const COOKIE = "jm_attribution";
const KEYS = Object.keys(Attribution.shape) as (keyof Attribution)[];

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
  if (pending) writeCookie(COOKIE, JSON.stringify(pending), 30);
  pending = null;
}

// Where this visitor came from (only known once marketing consent is given), or null. `cookies` defaults to the browser's.
export function getAttribution(cookies = document.cookie): Attribution | null {
  const raw = readCookie(COOKIE, cookies);
  if (!raw) return null;
  try {
    const parsed = Attribution.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
