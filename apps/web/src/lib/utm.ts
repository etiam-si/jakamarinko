import { Attribution } from "@jakamarinko/api";
import { readCookie, writeCookie } from "./cookie";

const COOKIE = "jm_attribution";
const KEYS = Object.keys(Attribution.shape) as (keyof Attribution)[];

// On landing: a link with any utm_*, fbclid or gclid replaces what we had (last touch) and is kept for 30 days.
export function captureAttribution(search: string) {
  const params = new URLSearchParams(search);
  const found: Attribution = {};
  for (const key of KEYS) {
    const value = params.get(key);
    if (value) found[key] = value.slice(0, 500);
  }
  if (Object.keys(found).length > 0) writeCookie(COOKIE, JSON.stringify(found), 30);
}

// Where this visitor came from, or null. `cookies` defaults to the browser's.
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
