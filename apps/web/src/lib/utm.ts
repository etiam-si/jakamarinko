import { Attribution } from "@jakamarinko/api";
import { readCookie } from "./cookie";
import { ATTRIBUTION_COOKIE } from "./utm-capture";

export { captureAttribution, storeAttribution } from "./utm-capture";

// Where this visitor came from (only known once marketing consent is given), or null. `cookies` defaults to the browser's.
export function getAttribution(cookies = document.cookie): Attribution | null {
  const raw = readCookie(ATTRIBUTION_COOKIE, cookies);
  if (!raw) return null;
  try {
    const parsed = Attribution.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
