import { Hono } from "hono";
import type { Health } from "@jakamarinko/shared";

// Everything lives under /api: on the server Traefik sends jakamarinko.com/api/* here, the rest to web.
export const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json<Health>({ ok: true, service: "api" }));
