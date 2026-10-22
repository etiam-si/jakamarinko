"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Coach } from "./coaches";

// Whose calendar the coach pages show: ?coach=<coach id>, the signed-in coach's own when missing.
export function CoachSwitcher({ coaches }: { coaches: Coach[] }) {
  const t = useTranslations("app.coachSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const self = coaches.find((c) => c.own)?.id;
  const current = useSearchParams().get("coach") ?? self ?? "";

  function pick(id: string) {
    router.replace({ pathname, query: id === self ? {} : { coach: id } });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="coach-switcher" className="text-xs text-muted-foreground">
        {t("label")}
      </Label>
      <Select value={current} onValueChange={pick}>
        <SelectTrigger id="coach-switcher" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {coaches.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.own ? t("you", { name: c.name }) : c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
