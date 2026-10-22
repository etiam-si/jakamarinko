import { readCookie, writeCookie } from "./cookie";

// Bump when categories or tags change in a way the visitor should agree to again: older choices then show the banner.
export const CONSENT_VERSION = 1;
export const CONSENT_COOKIE = "jm_consent";

export type Consent = { analytics: boolean; marketing: boolean };

// null = no valid choice for the current version, so the banner shows. Checked by hand, not with zod: this runs on
// every page, and zod alone would add a quarter to the script every visitor downloads.
export function parseConsent(raw: string | undefined): Consent | null {
  if (!raw) return null;
  try {
    const stored: unknown = JSON.parse(raw);
    if (typeof stored !== "object" || stored === null) return null;
    const { v, analytics, marketing } = stored as Record<string, unknown>;
    if (v !== CONSENT_VERSION || typeof analytics !== "boolean" || typeof marketing !== "boolean") return null;
    return { analytics, marketing };
  } catch {
    return null;
  }
}

export const serializeConsent = (consent: Consent) => JSON.stringify({ v: CONSENT_VERSION, ...consent });

// The same object until the cookie changes, as useSyncExternalStore needs.
let lastRaw: string | undefined;
let last: Consent | null = null;
export function readConsent(): Consent | null {
  const raw = readCookie(CONSENT_COOKIE, document.cookie);
  if (raw !== lastRaw) [lastRaw, last] = [raw, parseConsent(raw)];
  return last;
}

const listeners = new Set<() => void>();
export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Kept six months, then we ask again.
export function saveConsent(consent: Consent) {
  const before = readConsent();
  writeCookie(CONSENT_COOKIE, serializeConsent(consent), 180);
  const marketingWithdrawn = before?.marketing && !consent.marketing;
  if (marketingWithdrawn) clearMarketingCookies();
  // Loaded scripts can't be unloaded: on withdrawal start the page fresh.
  if (marketingWithdrawn || (before?.analytics && !consent.analytics)) {
    location.reload();
    return;
  }
  listeners.forEach((l) => l());
}

// Ours (jm_attribution) and Meta's (_fbp, _fbc) and Google's (_ga, _ga_*, _gcl_*), which they set on the host or
// the parent domain.
function clearMarketingCookies() {
  const host = location.hostname;
  const domains = ["", `; Domain=${host}`, `; Domain=.${host.replace(/^www\./, "")}`];
  for (const part of document.cookie.split(";")) {
    const name = part.trim().split("=")[0];
    if (!/^(jm_attribution$|_fbp|_fbc|_ga|_gcl)/.test(name)) continue;
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
  }
}

// The footer link calls this; the banner listens.
const OPEN_EVENT = "jm:consent-settings";
export const openConsentSettings = () => window.dispatchEvent(new Event(OPEN_EVENT));
export function onOpenConsentSettings(listener: () => void) {
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}
