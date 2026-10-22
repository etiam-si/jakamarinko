"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { navItems } from "./nav-items";

// The page a nav item stands for is the current one, or one of its subpages.
export const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

// The main pages in the header bar. The current one carries a signal line under it; hovering draws a quiet one.
export function NavLinks({ className }: { className?: string }) {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {navItems.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            className={cn(
              "relative flex h-10 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30",
              "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-foreground/25 after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 motion-reduce:after:transition-none",
              "aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100 aria-[current=page]:after:bg-signal",
            )}
          >
            {t(item.key)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
