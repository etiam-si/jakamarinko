import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { getSession } from "@/lib/session";

// Placeholder until T15 builds the customer overview.
export default async function AccountPage() {
  const session = await getSession();
  const t = await getTranslations();
  return (
    <PageHeader
      title={t("app.pages.overview.title")}
      lead={t("auth.account.signedInAs", { email: session?.user.email ?? "" })}
    />
  );
}
