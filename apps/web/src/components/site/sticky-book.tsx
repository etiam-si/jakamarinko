"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";

// Pages where a "Book a test" bar would be in the way: the booking flow itself, legal texts, ad landing pages.
const hiddenOn = ["/booking", "/legal", "/lp", "/styleguide"];

// Phones only: "Book a test" pinned to the bottom of the public pages, where the thumb is. The spacer keeps the
// footer from ending up under it. `from` is the cheapest test, formatted by the server.
export function StickyBook({ from }: { from: string }) {
  const t = useTranslations("common.actions");
  const pathname = usePathname();
  if (hiddenOn.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return (
    <>
      <div aria-hidden className="h-20 md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_-4px_rgb(18_26_24/0.08)] backdrop-blur md:hidden">
        <p className="min-w-0 flex-1 text-sm leading-tight text-muted-foreground">{from}</p>
        <Button asChild size="lg" className="px-5">
          <Link href="/booking">
            {t("bookTest")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </>
  );
}
