import { ArrowRight, AtSign, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { SectionHeading } from "@/components/brand/section-heading";
import { ContactForm } from "@/components/contact/contact-form";
import { Section } from "@/components/site/section";
import { pageMetadata, photos } from "@/components/site/site";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.meta" });
  return pageMetadata(locale, "/contact", { title: t("title"), description: t("description") });
}

// Call and email are the big buttons; the profiles are links under them.
const direct = [
  { key: "phone", icon: Phone },
  { key: "email", icon: Mail },
] as const;
const profiles = ["instagram", "strava"] as const;

export default function Contact({ params }: Props) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("contact");
  const common = useTranslations("common");
  const site = useTranslations("site");

  return (
    <main>
      <Section className="grid gap-10 pt-10 md:grid-cols-[minmax(0,1fr)_20rem] md:pt-16 lg:gap-16">
        <div className="flex min-w-0 flex-col gap-8">
          <SectionHeading as="h1" eyebrow={common("nav.contact")} title={t("title")} lead={t("text")} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {direct.map(({ key, icon: Icon }) => (
              <li key={key}>
                <a
                  href={t(`${key}.href`)}
                  className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-[box-shadow,border-color] hover:border-primary/40 hover:shadow-md"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-xs text-muted-foreground">{t(`${key}.label`)}</span>
                    <span className="font-semibold break-all">{t(`${key}.value`)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <ul className="-mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {profiles.map((key) => (
              <li key={key}>
                <a
                  href={t(`${key}.href`)}
                  target="_blank"
                  rel="me noopener"
                  className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                >
                  <AtSign aria-hidden className="size-4" />
                  {t(`${key}.label`)}: {t(`${key}.value`)}
                </a>
              </li>
            ))}
          </ul>
          <ContactForm />
        </div>
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-lg font-bold font-stretch-expanded">{t("book.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("book.text")}</p>
            <Button asChild className="w-full">
              <Link href="/booking">
                {common("actions.bookTest")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <PhotoFrame
            src={photos.europeans}
            alt={site("photos.europeans.alt")}
            caption={site("photos.europeans.caption")}
            aspect="portrait"
            position="28% 50%"
            className="mx-auto hidden w-full md:flex"
          />
        </aside>
      </Section>
    </main>
  );
}
