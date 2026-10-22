import type { Locale } from "@jakamarinko/types";
import { requireRole } from "@/lib/session";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// Placeholder: the coach area shell comes with T10. Coaches and up (owner ⊇ head_coach ⊇ coach).
export default async function CoachLayout({ children, params }: Props) {
  await requireRole((await params).locale as Locale, "/coach", "coach");
  return children;
}
