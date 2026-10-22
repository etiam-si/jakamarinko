import type { Locale } from "@jakamarinko/types";
import { requestedPath, requireRole } from "@/lib/session";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// Account pages that need health data consent: without it, the consent step. A layout of its own (not a check in
// account/layout.tsx), so it also runs when someone moves here from the privacy pages without a full page load.
export default async function HealthConsentLayout({ children, params }: Props) {
  const locale = (await params).locale as Locale;
  await requireRole(locale, await requestedPath(locale, "/account"));
  return children;
}
