"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "./nav-links";

// Phones: the nav and the language switch behind a menu button.
export function MobileMenu() {
  const t = useTranslations("common.nav");
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("openMenu")} className="md:hidden">
          <Menu aria-hidden className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-8 p-6">
        <SheetTitle>{t("label")}</SheetTitle>
        <nav aria-label={t("label")}>
          <NavLinks className="flex flex-col gap-1 text-base" onNavigate={() => setOpen(false)} />
        </nav>
        <LocaleSwitcher />
      </SheetContent>
    </Sheet>
  );
}
