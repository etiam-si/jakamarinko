"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Area } from "@/lib/nav";
import { NavList } from "./nav-list";

// Phones and tablets: the area menu in a sheet from the left. `children` go above the menu (coach switcher).
export function MobileNav({ area, children }: { area: Area; children?: React.ReactNode }) {
  const t = useTranslations("app");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("nav.openMenu")}>
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-6 bg-sidebar p-4">
        <Logo className="h-8 self-start" />
        <SheetTitle className="sr-only">{t(`areas.${area}`)}</SheetTitle>
        <SheetDescription className="sr-only">{t("nav.label")}</SheetDescription>
        {children}
        <NavList area={area} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
