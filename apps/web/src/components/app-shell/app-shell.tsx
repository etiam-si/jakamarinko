import { ArrowUpLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { isStaff, type Me } from "@jakamarinko/api";
import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import { type Area, areaHome } from "@/lib/nav";
import { CoachSwitcher } from "./coach-switcher";
import { getCoaches, showCoachSwitcher } from "./coaches";
import { MobileNav } from "./mobile-nav";
import { NavList } from "./nav-list";
import { UserMenu } from "./user-menu";

// The way back to the public site, at the foot of the menu.
export function WebsiteLink({ label }: { label: string }) {
  return (
    <Link
      href="/"
      className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30"
    >
      <ArrowUpLeft aria-hidden className="size-4" />
      {label}
    </Link>
  );
}

// The frame of a signed-in area: a sidebar from lg up, below that a top bar (blurred like the site header) with the
// menu in a sheet.
export async function AppShell({ area, session, children }: { area: Area; session: Me; children: React.ReactNode }) {
  const t = await getTranslations("app");
  const { user } = session;
  const coaches = area === "coach" ? await getCoaches() : [];
  const switcher = showCoachSwitcher(user.role, coaches) && <CoachSwitcher coaches={coaches} />;
  // Staff are customers too: they can switch to their own account and back.
  const switchTo: Area | undefined = isStaff(user.role) ? (area === "coach" ? "account" : "coach") : undefined;
  const menu = { name: user.name, email: user.email, switchTo };
  const areaName = t(`areas.${area}`);
  const website = <WebsiteLink label={t("nav.website")} />;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-sidebar p-4 text-sidebar-foreground lg:flex">
        <Link href={areaHome[area]} className="flex h-11 items-center self-start rounded-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">
          <Logo className="h-8" />
        </Link>
        <p className="flex items-center gap-2 px-1 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-signal" />
          {areaName}
        </p>
        {switcher}
        <NavList area={area} role={user.role} />
        <div className="mt-auto flex flex-col gap-2">
          {website}
          <div className="border-t pt-3">
            <UserMenu {...menu} />
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
          <Link href={areaHome[area]} aria-label={areaName} className="-ml-1 flex h-11 items-center gap-2.5 rounded-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">
            <Logo variant="mark" className="h-8" />
            <span aria-hidden className="truncate font-mono text-xs tracking-wider text-muted-foreground uppercase">
              {areaName}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <UserMenu {...menu} compact />
            <MobileNav area={area} role={user.role} footer={website}>
              {switcher}
            </MobileNav>
          </div>
        </div>
      </header>
      <main className="px-4 pt-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 md:px-10 lg:py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}
