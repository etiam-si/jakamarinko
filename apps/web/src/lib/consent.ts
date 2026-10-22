import { z } from "zod";
import { readCookie, writeCookie } from "./cookie";

// Bump when categories or tags change in a way the visitor should agree to again: older choices then show the banner.
export const CONSENT_VERSION = 1;
const COOKIE = "jm_consent";

const Stored = z.object({ v: z.number(), analytics: z.boolean(), marketing: z.boolean() });
export type Consent = Omit<z.infer<typeof Stored>, "v">;

// null = no valid choice for the current version, so the banner shows.
export function parseConsent(raw: string | undefined): Consent | null {
  if (!raw) return null;
  try {
    const stored = Stored.safeParse(JSON.parse(raw));
    if (!stored.success || stored.data.v !== CONSENT_VERSION) return null;
    return { analytics: stored.data.analytics, marketing: stored.data.marketing };
  } catch {
    return null;
  }
}

export const serializeConsent = (consent: Consent) => JSON.stringify({ v: CONSENT_VERSION, ...consent });

// The same object until the cookie changes, as useSyncExternalStore needs.
let lastRaw: string | undefined;
let last: Consent | null = null;
export function readConsent(): Consent | null {
  const raw = readCookie(COOKIE, document.cookie);
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
  writeCookie(COOKIE, serializeConsent(consent), 180);
  // Loaded scripts can't be unloaded: on withdrawal drop their cookies and start the page fresh.
  if ((before?.marketing && !consent.marketing) || (before?.analytics && !consent.analytics)) {
    clearTagCookies();
    location.reload();
    return;
  }
  listeners.forEach((l) => l());
}

// Meta (_fbp, _fbc) and Google (_ga, _ga_*, _gcl_*) set theirs on the host or the parent domain.
function clearTagCookies() {
  const host = location.hostname;
  const domains = ["", `; Domain=${host}`, `; Domain=.${host.replace(/^www\./, "")}`];
  for (const part of document.cookie.split(";")) {
    const name = part.trim().split("=")[0];
    if (!/^(_fbp|_fbc|_ga|_gcl)/.test(name)) continue;
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
