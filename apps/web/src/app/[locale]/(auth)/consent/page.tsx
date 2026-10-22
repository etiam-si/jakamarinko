import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@jakamarinko/types";
import { ConsentForm } from "@/components/auth/consent-form";
import { redirect } from "@/i18n/navigation";
import { getSession, safeNext } from "@/lib/session";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> };

// Asked once after the first sign-in, and again whenever health data consent has been withdrawn.
export default async function ConsentPage({ params, searchParams }: Props) {
  const locale = (await params).locale as Locale; // the root layout 404s any other
  setRequestLocale(locale);
  const next = safeNext((await searchParams).next);
  const session = await getSession();
  const query = next ? { next } : {};

  if (!session) return redirect({ href: { pathname: "/sign-in", query }, locale });
  if (session.consents.health_data) return redirect({ href: { pathname: "/sign-in/continue", query }, locale });

  const t = await getTranslations("auth.consent");
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <ConsentForm next={next} />
    </>
  );
}
