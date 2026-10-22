import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@jakamarinko/types";
import { AppShell } from "@/components/app-shell/app-shell";
import { requestedPath, requireSignIn } from "@/lib/session";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// The customer account: any signed-in user. Health data consent is required one level down, in (health-consent)/,
// for every page except privacy/: withdrawing consent must never lock anyone out of export and deletion.
export default async function AccountLayout({ children, params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const session = await requireSignIn(locale, await requestedPath(locale, "/account"));
  return (
    <AppShell area="account" session={session}>
      {children}
    </AppShell>
  );
}
