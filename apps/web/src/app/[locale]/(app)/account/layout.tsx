import type { Locale } from "@jakamarinko/types";
import { requireRole } from "@/lib/session";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// Placeholder: the customer account shell comes with T10. Any signed-in user with health data consent.
export default async function AccountLayout({ children, params }: Props) {
  await requireRole((await params).locale as Locale, "/account");
  return children;
}
