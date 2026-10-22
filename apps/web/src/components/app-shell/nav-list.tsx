"use client";

import { cn } from "cn";
import { useTranslations } from "next-intl";
import { roleAllows } from "@jakamarinko/api";
import type { Role } from "@jakamarinko/types";
import { Link, usePathname } from "@/i18n/navigation";
import { activeEntry, type Area, nav } from "@/lib/nav";

// The menu of one area, without entries above the user's role. `onNavigate` lets the mobile sheet close itself.
export function NavList({ area, role, onNavigate }: { area: Area; role: Role; onNavigate?: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const entries = nav.filter((e) => e.area === area && (!e.role || roleAllows(role, [e.role])));
  const active = activeEntry(entries, pathname);

  return (
    <nav aria-label={t("app.nav.label")}>
      <ul className="flex flex-col gap-0.5">
        {entries.map(({ href, label, icon: Icon, soon }) => {
          const item = "flex h-10 items-center gap-3 rounded-md px-3 text-sm";
          return (
            <li key={href}>
              {soon ? (
                <span aria-disabled="true" className={cn(item, "text-muted-foreground")}>
                  <Icon aria-hidden className="size-4" />
                  {t(label)}
                  <span className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase">
                    {t("app.nav.soon")}
                  </span>
                </span>
              ) : (
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active?.href === href ? "page" : undefined}
                  className={cn(
                    item,
                    "font-medium text-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-foreground",
                    "aria-[current=page]:bg-sidebar-primary aria-[current=page]:text-sidebar-primary-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                  {t(label)}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
