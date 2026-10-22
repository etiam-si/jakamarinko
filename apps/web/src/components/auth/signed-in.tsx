import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

// Who is signed in, with a sign-out button. Used by the placeholder account and coach pages.
export async function SignedIn() {
  const session = await getSession();
  const t = await getTranslations("auth.account");
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
      <p>{t("signedInAs", { email: session?.user.email ?? "" })}</p>
      <SignOutButton />
    </main>
  );
}
