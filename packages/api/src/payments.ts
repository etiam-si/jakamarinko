import { z } from "zod";

// GET /api/payments/config: whether bookings are paid online, and how prices are labelled.
export const PaymentsInfo = z.object({ enabled: z.boolean(), pricesIncludeVat: z.boolean(), holdMin: z.number() });
export type PaymentsInfo = z.infer<typeof PaymentsInfo>;

// POST /api/payments/checkout: a guest passes the token from their link, a signed-in owner needs none.
export const CheckoutInput = z.object({ bookingId: z.uuid(), token: z.string().max(100).optional() });
export type CheckoutInput = z.infer<typeof CheckoutInput>;
export const CheckoutSession = z.object({ url: z.url() });
export type CheckoutSession = z.infer<typeof CheckoutSession>;
