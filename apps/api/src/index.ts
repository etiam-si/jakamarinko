import { serve } from "@hono/node-server";
import { runMigrations } from "@jakamarinko/db";
import { app } from "./app";
import { env } from "./env";

// Apply new migrations before taking traffic.
await runMigrations(env.MIGRATIONS_DIR);

// No hostname: Node listens on :: (IPv4 and IPv6), or 0.0.0.0 where IPv6 is off.
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`api listening on :${info.port}`);
});
