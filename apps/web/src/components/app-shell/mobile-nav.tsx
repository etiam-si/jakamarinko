"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@jakamarinko/types";
import type { Area } from "@/lib/nav";
import { NavList } from "./nav-list";

// Phones and tablets: the area menu in a sheet from the right, where the menu button is. `children` go above the
// menu (coach switcher), `footer` at its foot (the way back to the website).
export function MobileNav({ area, role, footer, children }: { area: Area; role: Role; footer?: React.ReactNode; children?: React.ReactNode }) {
  const t = useTranslations("app");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("nav.openMenu")} className="size-11">
          <span aria-hidden className="flex w-5 flex-col items-end gap-[5px]">
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-3.5 rounded-full bg-current" />
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(20rem,88vw)] gap-6 bg-sidebar p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] [&>[data-slot=sheet-close]]:size-11"
      >
        <div className="flex h-11 items-center px-1">
          <Logo className="h-8" />
        </div>
        <SheetTitle className="sr-only">{t(`areas.${area}`)}</SheetTitle>
        <SheetDescription className="sr-only">{t("nav.label")}</SheetDescription>
        {children}
        <NavList area={area} role={role} onNavigate={() => setOpen(false)} />
        {footer && (
          <div className="mt-auto border-t pt-3" onClick={() => setOpen(false)}>
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
