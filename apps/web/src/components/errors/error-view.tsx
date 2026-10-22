"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Bib } from "./bib";

// What error.tsx shows when a page fails: the same race number, a retry and a way home. Nothing about the error
// itself reaches the visitor.
export function ErrorView({ reset }: { reset: () => void }) {
  const t = useTranslations("errors.error");
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1fr_auto] md:gap-16 md:px-8 md:py-24">
      <Bib number={t("number")} className="mx-auto md:order-last" />
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-4xl leading-[1.05] font-extrabold tracking-tight text-balance font-stretch-expanded md:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">{t("text")}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            <RotateCcw aria-hidden />
            {t("retry")}
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">{t("home")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
