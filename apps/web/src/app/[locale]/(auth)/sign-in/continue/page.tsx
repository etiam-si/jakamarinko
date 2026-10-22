import type { Locale } from "@jakamarinko/types";
import { redirect } from "@/i18n/navigation";
import { getSession, homeFor, safeNext } from "@/lib/session";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> };

// Where every sign-in lands: first the consent step if it's missing, then the page asked for, else home.
export default async function ContinuePage({ params, searchParams }: Props) {
  const locale = (await params).locale as Locale; // the root layout 404s any other
  const next = safeNext((await searchParams).next);
  const session = await getSession();
  const query = next ? { next } : {};

  if (!session) return redirect({ href: { pathname: "/sign-in", query }, locale });
  if (!session.consents.health_data) return redirect({ href: { pathname: "/consent", query }, locale });
  return redirect({ href: next ?? homeFor(session.user.role), locale });
}
