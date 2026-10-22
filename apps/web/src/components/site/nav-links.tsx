"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { navItems } from "./nav-items";

// The main pages, with the current one marked. Used in the header and the mobile menu.
export function NavLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  return (
    <ul className={className}>
      {navItems.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              "aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:decoration-signal aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8",
            )}
          >
            {t(item.key)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
