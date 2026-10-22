import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/components/site/site";
import { Link } from "@/i18n/navigation";

export type Doc = "privacy" | "terms" | "cookies";

// A section's body: a string is a paragraph, a list of strings is a bullet list.
type Section = { title: string; body: (string | string[])[] };

export async function legalMetadata(locale: string, doc: Doc): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMetadata(locale, `/legal/${doc}`, { title: t(`${doc}.title`), description: t(`${doc}.description`) });
}

// Renders one legal document from messages/{en,sl}/legal.json. Both languages share the keys,
// so a section or paragraph can't exist in one language only (the build checks it).
export async function LegalDocument({ doc }: { doc: Doc }) {
  const t = await getTranslations("legal");
  const sections = t.raw(`${doc}.sections`) as Record<string, Section>;
  const rich = (key: string) =>
    t.rich(`${doc}.sections.${key}`, {
      company: t("company.name"),
      address: t("company.address"),
      registration: t("company.registration"),
      vatId: t("company.vatId"),
      email: t("company.email"),
      b: (chunks) => <strong>{chunks}</strong>,
      privacy: (chunks) => <Link href="/legal/privacy" className="underline">{chunks}</Link>,
      terms: (chunks) => <Link href="/legal/terms" className="underline">{chunks}</Link>,
      cookies: (chunks) => <Link href="/legal/cookies" className="underline">{chunks}</Link>,
    });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t(`${doc}.title`)}</h1>
        <p className="text-muted-foreground text-sm">{t(`${doc}.updated`)}</p>
      </header>
      {Object.entries(sections).map(([id, section]) => (
        <section key={id} id={id} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          {section.body.map((block, i) =>
            Array.isArray(block) ? (
              <ul key={i} className="flex list-disc flex-col gap-2 pl-6">
                {block.map((_, j) => (
                  <li key={j}>{rich(`${id}.body.${i}.${j}`)}</li>
                ))}
              </ul>
            ) : (
              <p key={i}>{rich(`${id}.body.${i}`)}</p>
            ),
          )}
        </section>
      ))}
    </main>
  );
}
