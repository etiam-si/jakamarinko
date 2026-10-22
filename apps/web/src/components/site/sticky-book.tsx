"use client";

import { cn } from "cn";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ComponentProps, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";

// Pages where the bar would be in the way: the booking flow itself, the contact form, legal texts, and the ad landing
// pages (they have their own layout).
const hiddenOn = ["/booking", "/contact", "/legal", "/lp", "/styleguide"];
const typing = "input, textarea, select, [contenteditable]";

// Phones only: the page's action pinned to the bottom, where the thumb is. It slides in once the hero's primary
// call to action ([data-cta="primary"]) has scrolled away, so the two never show at once, and steps aside while
// someone types in a form. The spacer keeps the footer from ending up under it. `from` is the price line, formatted by
// the server; `href` and `label` default to "Book a test" → /booking.
export function StickyBook({
  from,
  href,
  label,
  always = false,
}: {
  from: string;
  href?: ComponentProps<typeof Link>["href"];
  label?: string;
  // On every page, including the ones in hiddenOn (the ad landing pages render their own).
  always?: boolean;
}) {
  const t = useTranslations("common.actions");
  const pathname = usePathname();
  const [pastHero, setPastHero] = useState(false);
  const [typingNow, setTypingNow] = useState(false);
  const hidden = !always && hiddenOn.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (hidden) return;
    const hero = document.querySelector('main [data-cta="primary"]');
    if (!hero) {
      setPastHero(true);
      return;
    }
    setPastHero(false);
    // Shown once the hero's button is out of view above (not while it's still below, on a short screen).
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [hidden, pathname]);

  useEffect(() => {
    const onFocus = (event: FocusEvent) => setTypingNow(event.target instanceof Element && event.target.matches(typing));
    const onBlur = () => setTypingNow(false);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  if (hidden) return null;
  const shown = pastHero && !typingNow;
  return (
    <>
      {/* Same graphite as the footer above it, so the page simply ends lower. */}
      <div aria-hidden className="dark h-[calc(5.5rem+env(safe-area-inset-bottom))] bg-background md:hidden" />
      <div
        data-sticky-cta
        data-shown={shown}
        inert={!shown}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border/80 bg-background/85 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(18_26_24/0.18)] backdrop-blur-lg backdrop-saturate-150 transition-[translate,opacity] duration-(--duration-slow) ease-(--ease-out-expo) md:hidden",
          !shown && "pointer-events-none translate-y-full opacity-0",
        )}
      >
        <p className="min-w-0 flex-1 text-sm leading-tight font-medium text-pretty text-muted-foreground">{from}</p>
        <Button asChild size="lg" className="px-5" data-cta="sticky">
          <Link href={href ?? "/booking"}>
            {label ?? t("bookTest")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </>
  );
}
