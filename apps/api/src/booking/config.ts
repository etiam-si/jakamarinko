import { z } from "zod";
import { paymentsConfig } from "../payments/config";

const Env = z.object({
  // The site's public origin, for links in emails (same variable as auth). Dev: this worktree's web server.
  BETTER_AUTH_URL: z.url().optional(),
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  // Online payment (T13). Off: bookings are confirmed right away and paid on site.
  PAYMENTS_ENABLED: z.enum(["true", "false"]).default("false"),
  BOOKING_BUFFER_MIN: z.coerce.number().int().min(0).default(15),
  BOOKING_NOTICE_HOURS: z.coerce.number().min(0).default(24),
  BOOKING_HORIZON_DAYS: z.coerce.number().int().positive().default(60),
  BOOKING_CANCEL_HOURS: z.coerce.number().min(0).default(24),
});

// Read on every call, so tests can change the environment. Empty values count as unset.
export function bookingConfig(source: NodeJS.ProcessEnv = process.env) {
  const e = Env.parse(Object.fromEntries(Object.entries(source).filter(([, v]) => v !== "")));
  return {
    siteUrl: (e.BETTER_AUTH_URL ?? `http://localhost:${e.WEB_PORT}`).replace(/\/$/, ""),
    // On only with the Stripe keys too (T13); otherwise a booking would wait for a payment nobody can make.
    paymentsEnabled: paymentsConfig(source).enabled,
    bufferMin: e.BOOKING_BUFFER_MIN,
    noticeMin: e.BOOKING_NOTICE_HOURS * 60,
    horizonDays: e.BOOKING_HORIZON_DAYS,
    cancelMin: e.BOOKING_CANCEL_HOURS * 60,
    stepMin: 30,
  };
}

export type BookingConfig = ReturnType<typeof bookingConfig>;
