import type { Role } from "@jakamarinko/types";
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  ShieldCheck,
  TicketPercent,
  UserRound,
  Users,
} from "lucide-react";

export type Area = "coach" | "account";

// One menu entry. `label` is a full message key, so a feature keeps its label in its own namespace.
// `soon`: shown greyed out with "Soon", not a link yet. `role`: only for that role and up (owner ⊇ head_coach ⊇ coach).
export type NavEntry = { area: Area; href: string; label: string; icon: LucideIcon; soon?: boolean; role?: Role };

// Every page in the signed-in areas, in menu order. A feature adds its page with one line here.
export const nav: NavEntry[] = [
  { area: "coach", href: "/coach", label: "app.nav.today", icon: CalendarCheck },
  { area: "coach", href: "/coach/bookings", label: "app.nav.bookings", icon: CalendarDays },
  { area: "coach", href: "/coach/requests", label: "app.nav.requests", icon: Inbox },
  { area: "coach", href: "/coach/athletes", label: "app.nav.athletes", icon: Users, soon: true },
  { area: "coach", href: "/coach/settings", label: "app.nav.settings", icon: Settings },
  { area: "coach", href: "/coach/ad-sources", label: "landing.report.nav", icon: BarChart3, role: "owner" },
  { area: "coach", href: "/coach/offers", label: "offers.nav", icon: TicketPercent, role: "head_coach" },
  { area: "account", href: "/account", label: "app.nav.overview", icon: LayoutDashboard },
  { area: "account", href: "/account/bookings", label: "app.nav.myBookings", icon: CalendarDays },
  { area: "account", href: "/account/profile", label: "app.nav.profile", icon: UserRound },
  { area: "account", href: "/account/privacy", label: "app.nav.privacy", icon: ShieldCheck },
];

export const areaHome: Record<Area, string> = { coach: "/coach", account: "/account" };

// The entry the current path belongs to: the longest href that is the path or a parent of it.
export function activeEntry(entries: NavEntry[], pathname: string) {
  return entries
    .filter((e) => pathname === e.href || pathname.startsWith(`${e.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
