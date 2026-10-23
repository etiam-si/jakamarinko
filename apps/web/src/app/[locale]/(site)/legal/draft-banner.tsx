import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { legalApproved } from "./approved";

// Read per request, so flipping LEGAL_APPROVED in the server .env needs a restart, not a new build.
export async function DraftBanner() {
  await connection();
  if (legalApproved()) return null;
  const t = await getTranslations("legal.draft");

  return (
    <div role="status" className="border-y border-amber-300 bg-amber-50 px-6 py-3 text-amber-950">
      <p className="mx-auto max-w-3xl">
        {/* The title on a line of its own: the banner then keeps its height whichever font is in, so the page
            below it does not move when the web font arrives. */}
        <strong className="block">{t("title")}</strong> {t("body")}
      </p>
    </div>
  );
}
