import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { ApiError } from "../lib/errors";

// Same per-IP limiter as the contact form (routes/requests.ts): in memory, right for the one api instance we run.
// The public offer endpoints answer whether a code exists, so guessing codes is slowed down to a crawl.
const buckets = new Set<Map<string, number[]>>();

export function resetOfferRateLimits() {
  for (const b of buckets) b.clear();
}

// Cloudflare sets CF-Connecting-IP and is the only one let through (infra/edge); dev has the socket address.
function clientIp(c: Context) {
  const cf = c.req.header("cf-connecting-ip");
  if (cf) return cf;
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown"; // app.request() in tests has no socket
  }
}

// At most `limit` requests per IP in `windowMs`; the next gets 429 too_many_requests.
export function rateLimit(limit: number, windowMs: number) {
  const seen = new Map<string, number[]>();
  buckets.add(seen);
  return createMiddleware(async (c, next) => {
    const now = Date.now();
    const ip = clientIp(c);
    const recent = (seen.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      seen.set(ip, recent);
      throw new ApiError(429, "too_many_requests", "Too many tries. Please wait a few minutes.");
    }
    seen.set(ip, [...recent, now]);
    if (seen.size > 10_000) for (const [key, times] of seen) if (times.every((t) => now - t >= windowMs)) seen.delete(key);
    await next();
  });
}
