import { Hono } from "hono";
import { CheckoutInput, type CheckoutSession, type PaymentsInfo } from "@jakamarinko/api";
import { getSessionUser } from "@jakamarinko/auth";
import { findBooking, mayManage } from "../booking/bookings";
import { bookingConfig } from "../booking/config";
import { ApiError } from "../lib/errors";
import { validate } from "../lib/validate";
import { checkoutUrl } from "../payments/checkout";
import { paymentsConfig } from "../payments/config";
import { stripe } from "../payments/stripe";
import { handleEvent } from "../payments/webhook";

const requireOn = () => {
  const config = paymentsConfig();
  if (!config.enabled) throw new ApiError(503, "payments_off", "Online payment is not available");
  return config;
};

export const payments = new Hono()
  .get("/config", (c) => {
    const { enabled, pricesIncludeVat, holdMin } = paymentsConfig();
    return c.json<PaymentsInfo>({ enabled, pricesIncludeVat, holdMin });
  })
  // The Stripe page for a booking waiting for payment; the web sends the customer there.
  .post("/checkout", validate("json", CheckoutInput), async (c) => {
    const config = requireOn();
    const { bookingId, token } = c.req.valid("json");
    const row = await findBooking(bookingId);
    if (!mayManage(row, await getSessionUser(c.req.raw.headers), token)) throw new ApiError(404, "not_found", "Booking not found");
    return c.json<CheckoutSession>({ url: await checkoutUrl(row, new Date(), config, bookingConfig()) });
  })
  // Stripe calls this. Only a correctly signed body is acted on; anything else changes nothing.
  .post("/stripe", async (c) => {
    const config = requireOn();
    const body = await c.req.text();
    const signature = c.req.header("stripe-signature") ?? "";
    let event;
    try {
      event = stripe().webhooks.constructEvent(body, signature, config.webhookSecret);
    } catch {
      throw new ApiError(400, "invalid_signature", "Invalid signature");
    }
    await handleEvent(event, new Date(), bookingConfig());
    return c.json({ received: true });
  });
