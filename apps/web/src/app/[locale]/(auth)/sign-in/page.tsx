import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthProviders } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { SignInForm } from "@/components/auth/sign-in-form";
import { redirect } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { getSession, safeNext } from "@/lib/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
};

// Better Auth sends expired or reused magic links back here with ?error=INVALID_TOKEN or EXPIRED_TOKEN.
const linkErrors = new Set(["INVALID_TOKEN", "EXPIRED_TOKEN", "ATTEMPTS_EXCEEDED"]);

export default async function SignInPage({ params, searchParams }: Props) {
  const locale = (await params).locale as Locale; // the root layout 404s any other
  setRequestLocale(locale);
  const { next, error } = await searchParams;
  if (await getSession()) redirect({ href: { pathname: "/sign-in/continue", query: next ? { next } : {} }, locale });

  const providers = AuthProviders.parse(await (await api.auth.providers.$get()).json());
  const t = await getTranslations("auth.signIn");

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight font-stretch-expanded">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </div>
      <SignInForm
        google={providers.google}
        next={safeNext(next)}
        error={error ? (linkErrors.has(error) ? "linkExpired" : "generic") : undefined}
      />
    </>
  );
}
