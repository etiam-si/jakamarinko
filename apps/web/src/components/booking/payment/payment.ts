import { useQuery } from "@tanstack/react-query";
import { CheckoutSession, PaymentsInfo, type Service } from "@jakamarinko/api";
import { api } from "@/lib/api";

async function fetchInfo() {
  const res = await api.payments.config.$get();
  if (!res.ok) throw new Error(`payments config: ${res.status}`);
  return PaymentsInfo.parse(await res.json());
}

// Whether bookings are paid online, and how prices are labelled. Undefined while loading.
export function usePayments() {
  return useQuery({ queryKey: ["payments-config"], queryFn: fetchInfo, staleTime: 5 * 60_000, retry: false }).data;
}

// A free service is never paid online.
export const paysOnline = (info: PaymentsInfo | undefined, service: Pick<Service, "priceCents">) => !!info?.enabled && service.priceCents > 0;

// Stripe's page for a booking waiting for payment. "expired" when its hold is over, null when it can't be opened now.
export async function checkoutUrl(bookingId: string, token: string | undefined): Promise<string | "expired" | null> {
  try {
    const res = await api.payments.checkout.$post({ json: { bookingId, token } });
    if (res.ok) return CheckoutSession.parse(await res.json()).url;
    const status: number = res.status;
    return status === 409 ? "expired" : null;
  } catch {
    return null;
  }
}
