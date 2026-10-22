import Stripe from "stripe";
import { paymentsConfig } from "./config";

let client: Stripe | undefined;
let clientKey = "";

// The Stripe client for the configured key, made once. Tests put a client with a fake HTTP layer in its place.
export function stripe(): Stripe {
  const { secretKey } = paymentsConfig();
  if (!client || clientKey !== secretKey) {
    client = new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 20_000 });
    clientKey = secretKey;
  }
  return client;
}

export function setStripe(next: Stripe) {
  client = next;
  clientKey = paymentsConfig().secretKey;
}
