import { Hono } from "hono";
import { notFound, onError } from "./lib/errors";
import { account } from "./routes/account";
import { auth } from "./routes/auth";
import { booking } from "./routes/booking";
import { calendar } from "./calendar/routes";
import { events } from "./routes/events";
import { health } from "./routes/health";
import { payments } from "./routes/payments";
import { conversions } from "./conversions/routes";
import { contactRequests } from "./routes/requests";
import { offers } from "./offers/routes";

// Everything lives under /api: on the server Traefik sends jakamarinko.com/api/* here, the rest to web.
// Routes are chained so AppType carries them all to the typed client in packages/api.
export const app = new Hono()
  .basePath("/api")
  // One line per domain, added above health (which stays last): .route("/<domain>", <domain>)
  .route("/auth", auth)
  .route("/events", events)
  .route("/booking", booking)
  .route("/requests", contactRequests)
  .route("/account", account)
  .route("/payments", payments)
  .route("/calendar", calendar)
  .route("/conversions", conversions)
  .route("/offers", offers)
  .route("/health", health);

app.onError(onError);
app.notFound(notFound);

export type AppType = typeof app;
