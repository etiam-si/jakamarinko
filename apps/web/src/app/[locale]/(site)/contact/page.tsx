import { Activity, ArrowRight, AtSign, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PhotoFrame } from "@/components/brand/photo-frame";
import { SectionHeading } from "@/components/brand/section-heading";
import { ContactForm } from "@/components/contact/contact-form";
import { Location } from "@/components/site/location";
import { PhotoSlot } from "@/components/site/photo-slot";
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

const direct = [
  { key: "phone", icon: Phone },
  { key: "email", icon: Mail },
] as const;
const profiles = [
  { key: "instagram", icon: AtSign },
  { key: "strava", icon: Activity },
] as const;

// Message first (the page's job), with the shortcut to booking right above it for people who already know which test
// they want. Direct lines, where and a line of proof sit beside it.
export default function Contact({ params }: Props) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("contact");
  const common = useTranslations("common");
  const site = useTranslations("site");

  return (
    <main>
      <Section reveal={false} className="grid gap-12 pt-8 md:pt-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16 lg:pt-20">
        <div className="flex min-w-0 flex-col gap-8">
          <SectionHeading as="h1" eyebrow={common("nav.contact")} title={t("title")} lead={t("text")} />
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="flex flex-col">
              <span className="font-semibold">{t("book.title")}</span>
              <span className="text-sm text-muted-foreground">{t("book.text")}</span>
            </p>
            <Button asChild data-cta="primary" className="shrink-0">
              <Link href="/booking">
                {t("book.cta")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          <ContactForm />
        </div>
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("direct")}</h2>
            <ul className="flex flex-col gap-3">
              {direct.map(({ key, icon: Icon }) => (
                <li key={key}>
                  <a href={t(`${key}.href`)} className="group lift flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm hover:border-primary/40">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-(--duration-base) group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs text-muted-foreground">{t(`${key}.label`)}</span>
                      <span className="font-semibold [overflow-wrap:anywhere]">{t(`${key}.value`)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-x-6 text-sm">
              {profiles.map(({ key, icon: Icon }) => (
                <li key={key}>
                  <a
                    href={t(`${key}.href`)}
                    target="_blank"
                    rel="me noopener"
                    className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    <Icon aria-hidden className="size-4" />
                    {t(`${key}.label`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <Location />
          <p className="border-l-2 border-signal pl-3 text-sm font-medium">{t("proof")}</p>
          <PhotoSlot
            slot="contactLab"
            className="hidden lg:flex"
            fallback={
              <PhotoFrame
                src={photos.europeans}
                alt={site("photos.europeans.alt")}
                caption={site("photos.europeans.caption")}
                position="12% 50%"
                sizes="22rem"
                className="hidden lg:flex"
              />
            }
          />
        </aside>
      </Section>
    </main>
  );
}
