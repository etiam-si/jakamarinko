import { getTranslations } from "next-intl/server";
import { ConfirmDelete } from "@/components/account/delete-account";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { searchParams: Promise<{ token?: string | string[] }> };

// Opened from the link in the deletion email (POST /api/account/delete). The api checks the token.
export default async function ConfirmDeletePage({ searchParams }: Props) {
  const t = await getTranslations("account.privacy.confirm");
  const { token } = await searchParams;
  return (
    <>
      <PageHeader title={t("title")} />
      {typeof token === "string" && token ? (
        <ConfirmDelete token={token} />
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground">{t("missing")}</p>
          <Button variant="outline" asChild>
            <Link href="/account/privacy">{t("back")}</Link>
          </Button>
        </div>
      )}
    </>
  );
}
