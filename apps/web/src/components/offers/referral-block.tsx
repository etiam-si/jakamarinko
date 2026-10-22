import { headers } from "next/headers";
import { getFormatter, getTranslations } from "next-intl/server";
import { offerRules, Referral } from "@jakamarinko/api";
import { OverviewBlock } from "@/components/account/overview-block";
import { eurFormat, euros } from "@/components/site/site";
import { api } from "@/lib/api";
import { CopyShare } from "./copy-share";

// Overview block (/account): the customer's referral link, with copy and share, and the credits it earned.
export default async function ReferralBlock() {
  const t = await getTranslations("offers.referral");
  const format = await getFormatter();
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await api.offers.referral.$get(undefined, { headers: { cookie } });
  if (!res.ok) throw new Error(`GET /api/offers/referral failed: ${res.status}`);
  const referral = Referral.parse(await res.json());
  const eur = (cents: number) => format.number(euros(cents), eurFormat);
  const amount = eur(offerRules.referralCents);

  return (
    <OverviewBlock id="referral" title={t("title")} state={{ kind: "ready" }}>
      <p className="text-sm text-pretty">{t("text", { amount })}</p>
      <CopyShare url={referral.url} shareText={t("shareText", { amount })} />
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t("credits")}</h3>
        {referral.credits.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCredits")}</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border" data-testid="referral-credits">
            {referral.credits.map((c) => (
              <li key={c.code} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
                <span className="font-medium">{t("credit", { amount: eur(c.amountCents) })}</span>
                <span className="font-mono text-xs">{c.code}</span>
                <span className="text-muted-foreground">
                  {c.used
                    ? t("used")
                    : c.expiresAt
                      ? t("validUntil", { date: format.dateTime(new Date(c.expiresAt), { dateStyle: "medium", timeZone: "Europe/Ljubljana" }) })
                      : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </OverviewBlock>
  );
}
