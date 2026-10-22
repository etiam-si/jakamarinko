import { getTranslations } from "next-intl/server";
import { getProfile } from "@/components/account/data";
import { ProfileForm } from "@/components/account/profile-form";
import { PageHeader } from "@/components/app-shell/page-header";

// Name, phone and the language of the site and the emails.
export default async function ProfilePage() {
  const t = await getTranslations("app.pages.profile");
  const profile = await getProfile();
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <ProfileForm profile={profile} />
    </>
  );
}
