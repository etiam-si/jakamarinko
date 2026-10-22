import { CONSENT_COOKIE, CONSENT_VERSION } from "@/lib/consent";

// Runs in <head> before the first paint: marks <html data-consent> when the visitor already chose (the same check as
// parseConsent), so the server-rendered banner never flashes for them. React removes the banner after hydration.
const script = `try{var m=document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);if(m){var c=JSON.parse(decodeURIComponent(m[1]));if(c&&c.v===${CONSENT_VERSION}&&typeof c.analytics==="boolean"&&typeof c.marketing==="boolean")document.documentElement.setAttribute("data-consent","")}}catch(e){}`;

export function ConsentScript() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <style>{"html[data-consent] [data-consent-banner]{display:none}"}</style>
    </>
  );
}
