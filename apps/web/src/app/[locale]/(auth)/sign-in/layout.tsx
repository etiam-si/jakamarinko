import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/components/site/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.signIn" });
  return pageMetadata(locale, "/sign-in", { title: t("title"), description: t("intro") });
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
