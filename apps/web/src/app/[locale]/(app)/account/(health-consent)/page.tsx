import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { OverviewBlock } from "@/components/account/overview-block";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { type OverviewBlockEntry, overviewBlocks } from "@/lib/overview-blocks";

type Props = { params: Promise<{ locale: string }> };

async function Block({ entry }: { entry: OverviewBlockEntry }) {
  const { default: Component } = await entry.load();
  return <Component />;
}

// The customer overview: one block per entry in lib/overview-blocks.ts, each loading on its own.
export default async function AccountPage({ params }: Props) {
  setRequestLocale((await params).locale);
  const session = await getSession();
  const t = await getTranslations();
  return (
    <>
      <PageHeader
        title={t("app.pages.overview.title")}
        lead={t("auth.account.signedInAs", { email: session?.user.email ?? "" })}
        action={
          <Button asChild className="h-11">
            <Link href="/booking">{t("common.actions.bookTest")}</Link>
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {overviewBlocks.map((entry) => (
          <Suspense
            key={entry.id}
            fallback={
              <OverviewBlock id={entry.id} title={t(entry.title)} state={{ kind: "loading", label: t("account.block.loading") }} wide={entry.wide} />
            }
          >
            <Block entry={entry} />
          </Suspense>
        ))}
      </div>
    </>
  );
}
