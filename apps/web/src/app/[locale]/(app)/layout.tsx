import type { Metadata } from "next";
import { use } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ClientMessages } from "@/i18n/client-messages";

// Signed-in areas: never in search results. The guards and the frame live in coach/ and account/.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// The coach and account areas are mostly client components, so they get every namespace they use.
const appMessages = ["app", "auth", "account", "booking", "coach-booking", "payments", "calendar", "requests"];

export default function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  return (
    <ClientMessages locale={use(params).locale} messages={appMessages}>
      {children}
      {/* Only the signed-in areas show toasts, so public pages skip their script. */}
      <Toaster />
    </ClientMessages>
  );
}
