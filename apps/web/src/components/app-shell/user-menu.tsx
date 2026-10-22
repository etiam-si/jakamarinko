"use client";

import { ArrowLeftRight, Check, LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { type Area, areaHome } from "@/lib/nav";

type Props = { name: string; email: string; switchTo?: Area; compact?: boolean };

const initials = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

// Who is signed in, the language, the switch between coach and customer view (staff only), sign out.
export function UserMenu({ name, email, switchTo, compact }: Props) {
  const t = useTranslations("app.userMenu");
  const tLocale = useTranslations("common.localeSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={t("label")} className={compact ? "size-9 p-0" : "h-12 w-full justify-start gap-3 px-2"}>
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs text-primary-foreground"
          >
            {initials(name || email)}
          </span>
          {!compact && (
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="w-full truncate text-sm font-medium">{name || email}</span>
              {name && <span className="w-full truncate text-xs font-normal text-muted-foreground">{email}</span>}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "top"} className="w-60">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup aria-label={tLocale("label")}>
          <DropdownMenuLabel className="text-xs text-muted-foreground">{tLocale("label")}</DropdownMenuLabel>
          {routing.locales.map((l) => (
            <DropdownMenuItem key={l} asChild>
              <Link href={pathname} locale={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}>
                {tLocale(l)}
                {l === locale && <Check aria-hidden className="ml-auto" />}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {switchTo && (
          <DropdownMenuItem asChild>
            <Link href={areaHome[switchTo]}>
              <ArrowLeftRight aria-hidden />
              {t(switchTo === "coach" ? "toCoach" : "toAccount")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={signOut}>
          <LogOut aria-hidden />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
