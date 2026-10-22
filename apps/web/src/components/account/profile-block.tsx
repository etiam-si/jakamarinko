import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProfile } from "./data";
import { OverviewBlock } from "./overview-block";

// What makes a profile complete. Language always has a value.
export const profileFields = ["name", "phone"] as const;

// Overview block: how much of the profile is filled in.
export default async function ProfileBlock() {
  const t = await getTranslations("account.overview.profile");
  const profile = await getProfile();
  const missing = profileFields.filter((f) => !profile[f]);
  const done = profileFields.length - missing.length;
  return (
    <OverviewBlock
      id="profile"
      title={t("title")}
      state={{ kind: "ready" }}
      action={
        <Link href="/account/profile" className="text-sm underline underline-offset-4">
          {t("edit")}
        </Link>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t("progress", { done, total: profileFields.length })}</p>
        <div
          role="progressbar"
          aria-label={t("title")}
          aria-valuemin={0}
          aria-valuemax={profileFields.length}
          aria-valuenow={done}
          className="flex h-1.5 gap-1"
        >
          {profileFields.map((f) => (
            <span key={f} className={`flex-1 rounded-full ${missing.includes(f) ? "bg-muted" : "bg-primary"}`} />
          ))}
        </div>
      </div>
      <p className="text-sm text-pretty text-muted-foreground">
        {missing.length ? t("missing", { fields: missing.map((f) => t(f)).join(", ") }) : t("complete")}
      </p>
    </OverviewBlock>
  );
}
