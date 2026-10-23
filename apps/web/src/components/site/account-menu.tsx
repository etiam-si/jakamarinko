"use client";

import { CalendarDays, LayoutDashboard, LogOut, UserRound, Whistle } from "lucide-react";
import { useTranslations } from "next-intl";
import { AccountAvatar } from "@/components/brand/account-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/i18n/navigation";
import { forgetHeaderAccount, type HeaderAccount, useHeaderAccount } from "./account";

// The account's pages, in menu order. Staff also get the coach area.
export const accountLinks = (account: HeaderAccount) =>
  [
    { href: "/account", key: "myAccount", icon: LayoutDashboard },
    { href: "/account/bookings", key: "myBookings", icon: CalendarDays },
    ...(account.staff ? [{ href: "/coach", key: "coachArea", icon: Whistle }] : []),
  ] as const;

// Signs out and re-renders the page signed out. The auth client loads only when someone actually signs out.
export function useSignOut() {
  const router = useRouter();
  return async () => {
    const { authClient } = await import("@/lib/auth-client");
    await authClient.signOut();
    forgetHeaderAccount();
    router.refresh();
  };
}

// The header's account entry: "Sign in" for visitors (only the icon on phones), the person's bib with a menu once
// they're signed in. The page arrives with "Sign in" (it is static); the bib replaces it once the browser knows.
// Both sit in a box of one width, so the swap moves nothing around them.
export function AccountMenu() {
  const account = useHeaderAccount();
  return <div className="flex w-11 shrink-0 justify-end md:w-28">{account ? <SignedIn account={account} /> : <SignIn />}</div>;
}

function SignIn() {
  const t = useTranslations("header.account");
  return (
    <Button asChild variant="ghost" className="size-11 p-0 md:h-10 md:w-auto md:px-3 md:has-[>svg]:px-3">
      <Link href="/sign-in">
        <UserRound aria-hidden className="size-5 md:size-4" />
        <span className="max-md:sr-only">{t("signIn")}</span>
      </Link>
    </Button>
  );
}

function SignedIn({ account }: { account: HeaderAccount }) {
  const t = useTranslations("header.account");
  const signOut = useSignOut();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label={t("menu")} data-account-trigger className="size-11 rounded-full p-0">
          <AccountAvatar initials={account.initials} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 px-3 py-2.5 font-normal">
          <AccountAvatar initials={account.initials} />
          <span className="flex min-w-0 flex-col">
            {account.name && <span className="truncate text-sm font-semibold text-foreground">{account.name}</span>}
            <span className="truncate text-xs text-muted-foreground">{account.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountLinks(account).map(({ href, key, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild className="min-h-11 gap-3 px-3">
            <Link href={href}>
              <Icon aria-hidden className="text-muted-foreground" />
              {t(key)}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="min-h-11 gap-3 px-3">
          <LogOut aria-hidden className="text-muted-foreground" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
