"use client";

import { cn } from "cn";
import { ArrowRight, LogOut, UserRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";
import { BibAvatar } from "@/components/brand/bib-avatar";
import { Logo } from "@/components/brand/logo";
import { LanguageMenu } from "@/components/i18n/language-menu";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import type { HeaderAccount } from "./account";
import { accountLinks, useSignOut } from "./account-menu";
import styles from "./mobile-menu.module.css";
import { navItems } from "./nav-items";
import { isCurrent } from "./nav-links";

// Below lg: the whole menu on one deep spruce screen. The pages in large type, then the account, the language and,
// pinned to the bottom where the thumb is, "Book a test". A modal dialog: focus stays inside, the page behind
// doesn't scroll, Escape closes it and focus goes back to the menu button.
export function MobileMenu({ account }: { account: HeaderAccount | null }) {
  const t = useTranslations("common");
  const tHeader = useTranslations("header");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const close = () => setOpen(false);

  // Closes when the page changes underneath (back button) and when the window grows past the phone layout.
  useEffect(close, [pathname]);
  // The page behind stays put while the menu is open: Radix blocks the scroll events, this also locks the page
  // itself (a rubber-band swipe on iOS, the scrollbar on a desktop).
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = before;
    };
  }, [open]);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const onChange = () => wide.matches && close();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  let row = 0;
  const rise = () => ({ "data-rise": true, style: { "--i": row++ } as React.CSSProperties });
  const eyebrow = "font-mono text-xs tracking-wider text-muted-foreground uppercase";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("nav.openMenu")} className="size-11 lg:hidden">
          <span aria-hidden className="flex w-5 flex-col items-end gap-[5px]">
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-3.5 rounded-full bg-current" />
          </span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          aria-modal="true"
          className={cn(styles.panel, "fixed inset-0 z-50 flex flex-col bg-primary-deep outline-none")}
        >
          <div className="dark flex min-h-0 flex-1 flex-col bg-[radial-gradient(90%_55%_at_100%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_70%)] pt-[env(safe-area-inset-top)] text-foreground">
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-8">
              <Link href="/" aria-label={t("nav.home")} onClick={close} className="-ml-1 flex h-11 items-center rounded-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                <Logo variant="mark" className="h-9 sm:hidden" />
                <Logo className="hidden h-9 sm:block" />
              </Link>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label={t("nav.closeMenu")} className="size-11 hover:bg-white/10">
                  <X aria-hidden className="size-5" />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Title className="sr-only">{t("nav.label")}</Dialog.Title>

            <div className="flex min-h-0 flex-1 flex-col gap-9 overflow-y-auto overscroll-contain px-4 pt-2 pb-8 sm:px-8">
              <nav aria-label={t("nav.label")}>
                <ul>
                  {navItems.map((item) => (
                    <li key={item.href} {...rise()}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                        className="group flex min-h-16 items-center gap-3 border-b border-white/10 py-3 font-heading text-[1.75rem] leading-none font-bold tracking-tight text-foreground/85 outline-none font-stretch-expanded transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline aria-[current=page]:text-foreground min-[400px]:text-[2rem]"
                      >
                        <span className="min-w-0 flex-1 break-words">{t(`nav.${item.key}`)}</span>
                        <span aria-hidden className="hidden size-2 shrink-0 rounded-full bg-signal group-aria-[current=page]:block" />
                        <ArrowRight
                          aria-hidden
                          className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-aria-[current=page]:hidden motion-reduce:transition-none"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="grid gap-9 sm:grid-cols-2 sm:items-start sm:gap-6">
                <section aria-labelledby="menu-account" className="flex flex-col gap-3" {...rise()}>
                  <h2 id="menu-account" className={eyebrow}>
                    {tHeader("menu.account")}
                  </h2>
                  {account ? (
                    <div className="flex flex-col overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-white/10">
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <BibAvatar initials={account.initials} />
                        <span className="flex min-w-0 flex-col">
                          {account.name && <span className="truncate font-semibold">{account.name}</span>}
                          <span className="truncate text-sm text-muted-foreground">{account.email}</span>
                        </span>
                      </div>
                      <ul className="border-t border-white/10">
                        {accountLinks(account).map(({ href, key, icon: Icon }) => (
                          <li key={href}>
                            <Link
                              href={href}
                              onClick={close}
                              className="flex min-h-12 items-center gap-3 px-4 text-base font-medium outline-none hover:bg-white/[0.06] focus-visible:bg-white/[0.08]"
                            >
                              <Icon aria-hidden className="size-4 text-muted-foreground" />
                              {tHeader(`account.${key}`)}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              close();
                              void signOut();
                            }}
                            className="flex min-h-12 w-full cursor-pointer items-center gap-3 border-t border-white/10 px-4 text-left text-base font-medium outline-none hover:bg-white/[0.06] focus-visible:bg-white/[0.08]"
                          >
                            <LogOut aria-hidden className="size-4 text-muted-foreground" />
                            {tHeader("account.signOut")}
                          </button>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline" size="lg" className="w-full border-white/20 bg-transparent hover:bg-white/10 dark:bg-transparent">
                        <Link href="/sign-in" onClick={close}>
                          <UserRound aria-hidden />
                          {tHeader("account.signIn")}
                        </Link>
                      </Button>
                      <p className="text-sm text-muted-foreground">{tHeader("menu.signInHint")}</p>
                    </div>
                  )}
                </section>

                <div className="flex flex-col gap-3" {...rise()}>
                  <p className={eyebrow} aria-hidden>
                    {tHeader("language.label")}
                  </p>
                  <LanguageMenu full className="rounded-xl bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/10" />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8" {...rise()}>
              <Button asChild size="lg" className="w-full">
                <Link href="/booking" onClick={close}>
                  {t("actions.bookTest")}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
