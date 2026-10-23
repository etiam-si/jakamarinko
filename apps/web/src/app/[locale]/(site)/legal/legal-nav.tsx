"use client";

import { cn } from "cn";
import { Link, usePathname } from "@/i18n/navigation";

// The three legal documents as tabs, 44 px tall, the current one filled.
export function LegalNav({ label, docs }: { label: string; docs: { href: string; title: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6">
      <ul className="flex flex-wrap gap-2">
        {docs.map((doc) => {
          const current = pathname === doc.href;
          return (
            <li key={doc.href}>
              <Link
                href={doc.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-(--duration-fast)",
                  current ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/30 hover:bg-muted/60",
                )}
              >
                {doc.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
