import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Bib } from "./bib";

const links = [
  { href: "/", label: "home" },
  { href: "/lab", label: "lab" },
  { href: "/contact", label: "contact" },
] as const;

// The 404 page: a race number with the code, one action (book a test) and the pages most people want.
export function NotFoundView() {
  const t = useTranslations("errors.notFound");
  const common = useTranslations("common");
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[1fr_auto] md:gap-16 md:px-8 md:py-24">
      <Bib number={t("number")} className="ml-2 md:order-last md:mx-auto" />
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-4xl leading-[1.05] font-extrabold tracking-tight text-balance font-stretch-expanded md:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">{t("text")}</p>
        <Button asChild size="lg" className="self-start">
          <Link href="/booking">
            {common("actions.bookTest")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
        <nav aria-label={t("linksLabel")} className="flex flex-col gap-3 border-t border-border pt-6">
          <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t("linksLabel")}</p>
          <ul className="flex flex-wrap gap-2">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Button asChild variant="outline">
                  <Link href={href}>{common(`nav.${label}`)}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
