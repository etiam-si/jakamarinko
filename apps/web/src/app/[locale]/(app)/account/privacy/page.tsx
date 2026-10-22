import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ConsentsPanel } from "@/components/account/consents-panel";
import { getConsents } from "@/components/account/data";
import { DeleteAccount } from "@/components/account/delete-account";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";

function Part({ id, title, lead, children }: { id: string; title: string; lead: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{lead}</p>
      </div>
      {children}
    </section>
  );
}

// Consents, data export and account deletion.
export default async function PrivacyPage() {
  const t = await getTranslations("app.pages.privacy");
  const tp = await getTranslations("account.privacy");
  const [session, history] = await Promise.all([getSession(), getConsents()]);
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <Part id="consents" title={tp("consents.title")} lead={tp("consents.lead")}>
        <ConsentsPanel history={history} />
      </Part>
      <Part id="export" title={tp("export.title")} lead={tp("export.body")}>
        <div>
          <Button variant="outline" asChild>
            <a href="/api/account/export" download>
              <Download aria-hidden />
              {tp("export.button")}
            </a>
          </Button>
        </div>
      </Part>
      <Part id="delete" title={tp("delete.title")} lead={tp("delete.body")}>
        <DeleteAccount email={session?.user.email ?? ""} />
      </Part>
    </>
  );
}
