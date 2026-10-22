import { Hono } from "hono";
import { notFound, onError } from "./lib/errors";
import { events } from "./routes/events";
import { health } from "./routes/health";

// Everything lives under /api: on the server Traefik sends jakamarinko.com/api/* here, the rest to web.
// Routes are chained so AppType carries them all to the typed client in packages/api.
export const app = new Hono()
  .basePath("/api")
  // One line per domain, added above health (which stays last): .route("/<domain>", <domain>)
  .route("/events", events)
  .route("/health", health);

app.onError(onError);
app.notFound(notFound);

export type AppType = typeof app;
