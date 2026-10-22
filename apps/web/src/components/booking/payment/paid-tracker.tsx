"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// Back from Stripe with the payment in: the browser copy of booking_paid. The api reports the same event id to Meta
// from the webhook, so the two count once; the value comes with the server copy.
export function PaidTracker({ id, service }: { id: string; service: string }) {
  useEffect(() => {
    track("booking_paid", { service }, `booking_paid-${id}`);
  }, [id, service]);
  return null;
}
