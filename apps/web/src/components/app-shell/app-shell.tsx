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

// The frame of a signed-in area: a sidebar from lg up, below that a top bar with the menu in a sheet.
export async function AppShell({ area, session, children }: { area: Area; session: Me; children: React.ReactNode }) {
  const t = await getTranslations("app");
  const { user } = session;
  const coaches = area === "coach" ? await getCoaches(session) : [];
  const switcher = showCoachSwitcher(user.role, coaches) && <CoachSwitcher coaches={coaches} self={user.id} />;
  // Staff are customers too: they can switch to their own account and back.
  const switchTo: Area | undefined = isStaff(user.role) ? (area === "coach" ? "account" : "coach") : undefined;
  const menu = { name: user.name, email: user.email, switchTo };
  const areaName = t(`areas.${area}`);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-sidebar p-4 text-sidebar-foreground lg:flex">
        <Link href={areaHome[area]} className="self-start px-1 pt-1">
          <Logo className="h-8" />
        </Link>
        <p className="flex items-center gap-2 px-1 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-signal" />
          {areaName}
        </p>
        {switcher}
        <NavList area={area} />
        <div className="mt-auto border-t pt-3">
          <UserMenu {...menu} />
        </div>
      </aside>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-2 backdrop-blur lg:hidden">
        <MobileNav area={area}>{switcher}</MobileNav>
        <Link href={areaHome[area]} aria-label={areaName}>
          <Logo variant="mark" className="h-8" />
        </Link>
        <span className="truncate font-mono text-xs tracking-wider text-muted-foreground uppercase">{areaName}</span>
        <div className="ml-auto">
          <UserMenu {...menu} compact />
        </div>
      </header>
      <main className="px-4 py-8 md:px-10 lg:py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}
