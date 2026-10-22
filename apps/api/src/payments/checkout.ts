import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@jakamarinko/db";
import { bookings, serviceTypes } from "@jakamarinko/db/schema";
import { manageUrl, type BookingRow } from "../booking/bookings";
import type { BookingConfig } from "../booking/config";
import { serviceName } from "../booking/catalog";
import { timeZone } from "../booking/time";
import { ApiError } from "../lib/errors";
import type { PaymentsConfig } from "./config";
import { stripe } from "./stripe";

// Stripe keeps a Checkout session open for at least 30 minutes; the expiry job closes it once the hold is over.
const sessionMin = 30;

const vatLabel = { en: "VAT ID", sl: "ID za DDV" } as const;

// The hold ends this long after the booking was made.
export const holdEnds = (b: BookingRow["booking"], config: PaymentsConfig) => new Date(b.createdAt.getTime() + config.holdMin * 60_000);

function when(b: BookingRow["booking"]) {
  const format = new Intl.DateTimeFormat(b.locale === "sl" ? "sl-SI" : "en-GB", { timeZone, dateStyle: "full", timeStyle: "short" });
  return format.format(b.startAt);
}

// The invoice carries the company details from env next to what the Stripe dashboard has (name, address).
function invoiceData(b: BookingRow["booking"], config: PaymentsConfig): Stripe.Checkout.SessionCreateParams.InvoiceCreation.InvoiceData {
  const { name, address, vatId } = config.invoice;
  const footer = [name, address].filter(Boolean).join(", ");
  return {
    metadata: { booking_id: b.id },
    ...(footer && { footer }),
    ...(vatId && { custom_fields: [{ name: vatLabel[b.locale], value: vatId }] }),
  };
}

// A hosted Checkout page for a booking waiting for payment. An open session is reused, so a second click or a
// return from Stripe's back link doesn't start a second payment.
export async function checkoutUrl(row: BookingRow, now: Date, config: PaymentsConfig, bookingCfg: BookingConfig) {
  const b = row.booking;
  if (b.status !== "pending_payment") throw new ApiError(409, "not_pending", "This booking is not waiting for payment");
  if (holdEnds(b, config) <= now) throw new ApiError(409, "hold_expired", "The time held for payment is over");

  if (b.stripeCheckoutSessionId) {
    const open = await stripe().checkout.sessions.retrieve(b.stripeCheckoutSessionId);
    if (open.status === "open" && open.url) return open.url;
  }

  const [service] = await db().select({ priceCents: serviceTypes.priceCents }).from(serviceTypes).where(eq(serviceTypes.id, b.serviceTypeId));
  const back = manageUrl(b, bookingCfg);
  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      client_reference_id: b.id,
      metadata: { booking_id: b.id },
      payment_intent_data: { metadata: { booking_id: b.id } },
      customer_email: b.customerEmail,
      locale: b.locale,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: service!.priceCents,
            tax_behavior: config.pricesIncludeVat ? "inclusive" : "exclusive",
            product_data: { name: serviceName(row.service, b.locale), description: `${when(b)}, ${row.location.name}` },
          },
        },
      ],
      invoice_creation: { enabled: true, invoice_data: invoiceData(b, config) },
      tax_id_collection: { enabled: true },
      expires_at: Math.floor(now.getTime() / 1000) + sessionMin * 60,
      success_url: `${back}&confirmed=1&paid=1`,
      cancel_url: back,
    },
    // Two clicks in the same second make one session.
    { idempotencyKey: `checkout-${b.id}-${Math.floor(now.getTime() / 1000)}` },
  );
  await db().update(bookings).set({ stripeCheckoutSessionId: session.id }).where(eq(bookings.id, b.id));
  return session.url!;
}
