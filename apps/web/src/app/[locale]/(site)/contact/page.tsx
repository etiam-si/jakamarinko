import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { SectionHeading } from "@/components/brand/section-heading";
import { ContactForm } from "@/components/contact/contact-form";
import { Section } from "@/components/site/section";
import { pageMetadata, photos } from "@/components/site/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.meta" });
  return pageMetadata(locale, "/contact", { title: t("title"), description: t("description") });
}

const channels = [
  { key: "phone", external: false },
  { key: "email", external: false },
  { key: "instagram", external: true },
  { key: "strava", external: true },
] as const;

export default function Contact({ params }: Props) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("contact");
  const site = useTranslations("site");

  return (
    <main>
      <Section className="grid gap-12 pt-10 md:grid-cols-2 md:pt-16">
        <div className="flex flex-col gap-10">
          <SectionHeading as="h1" title={t("title")} lead={t("text")} />
          <dl className="flex flex-col divide-y divide-border border-y border-border">
            {channels.map(({ key, external }) => (
              <div key={key} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                <dt className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t(`${key}.label`)}</dt>
                <dd>
                  <a
                    href={t(`${key}.href`)}
                    {...(external && { target: "_blank", rel: "me noopener" })}
                    className="text-lg font-medium break-all text-primary underline-offset-4 hover:underline"
                  >
                    {t(`${key}.value`)}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
          <ContactForm />
        </div>
        <PhotoFrame
          src={photos.europeans}
          alt={site("photos.europeans.alt")}
          caption={site("photos.europeans.caption")}
          aspect="portrait"
          position="28% 50%"
          className="mx-auto md:mx-0 md:justify-self-end"
        />
      </Section>
    </main>
  );
}
