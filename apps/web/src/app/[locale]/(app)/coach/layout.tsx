import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@jakamarinko/types";
import { AppShell } from "@/components/app-shell/app-shell";
import { requireRole } from "@/lib/session";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// The coach area. Coaches and up (owner ⊇ head_coach ⊇ coach); everyone else gets a 404.
export default async function CoachLayout({ children, params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const session = await requireRole(locale, "/coach", "coach");
  return (
    <AppShell area="coach" session={session}>
      {children}
    </AppShell>
  );
}
