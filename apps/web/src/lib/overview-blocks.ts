import type { ComponentType } from "react";

// One block of the customer overview (/account). `title` is a full message key (shown while it loads);
// `load` imports a module whose default export is the block: an async server component that renders
// components/account/overview-block.tsx in its empty, ready or processing state.
export type OverviewBlockEntry = {
  id: string;
  title: string;
  load: () => Promise<{ default: ComponentType | (() => Promise<React.ReactNode>) }>;
  wide?: boolean;
};

// The overview, in order. A feature adds its block with one line here.
export const overviewBlocks: OverviewBlockEntry[] = [
  { id: "next-booking", title: "account.overview.nextBooking.title", load: () => import("@/components/account/next-booking-block"), wide: true },
  { id: "past-bookings", title: "account.overview.pastBookings.title", load: () => import("@/components/account/past-bookings-block") },
  { id: "profile", title: "account.overview.profile.title", load: () => import("@/components/account/profile-block") },
];
