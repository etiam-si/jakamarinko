import { use } from "react";
import { Providers } from "@/components/providers/providers";
import { ClientMessages } from "@/i18n/client-messages";

// The booking flow and the booking page are client components: they get the booking and payment texts, and the
// query cache they load slots and payments with.
export default function BookingLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  return (
    <ClientMessages locale={use(params).locale} messages={["booking", "payments"]}>
      <Providers>{children}</Providers>
    </ClientMessages>
  );
}
