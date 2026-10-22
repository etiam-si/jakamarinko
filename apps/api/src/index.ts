import { serve } from "@hono/node-server";
import { seed } from "@jakamarinko/auth";
import { runMigrations } from "@jakamarinko/db";
import { app } from "./app";
import { seedBooking } from "./booking/seed";
import { env } from "./env";
import { logPaymentsStatus } from "./payments/config";

// Apply new migrations before taking traffic.
await runMigrations(env.MIGRATIONS_DIR);
// Owner, head coach and the default location from env; a no-op when they exist.
await seed();
// Service types from the catalog, and the sample availability (apps/api/src/booking/seed.ts).
await seedBooking();
// Online payment needs PAYMENTS_ENABLED and both Stripe keys; the log says which one is missing.
logPaymentsStatus();

// No hostname: Node listens on :: (IPv4 and IPv6), or 0.0.0.0 where IPv6 is off.
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`api listening on :${info.port}`);
});
