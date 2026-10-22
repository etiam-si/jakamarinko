import { getConnInfo } from "@hono/node-server/conninfo";
import { desc, eq } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { type ContactRequest, CreateRequestInput, RequestsQuery, UpdateRequestInput } from "@jakamarinko/api";
import { db } from "@jakamarinko/db";
import { requests, users } from "@jakamarinko/db/schema";
import { sendEmail } from "@jakamarinko/email";
import { bookingConfig } from "../booking/config";
import { requireRole } from "../lib/auth";
import { ApiError } from "../lib/errors";
import { validate } from "../lib/validate";

const IdParam = z.object({ id: z.uuid() });
const staff = requireRole("coach");

const limit = 5;
const windowMs = 60 * 60 * 1000;
// Submissions per IP in the last hour. In memory: right for the one api instance we run, and it resets on restart.
// With more instances this has to move to Postgres or Redis.
const sent = new Map<string, number[]>();

export function resetRateLimit() {
  sent.clear();
}

// Records one submission; false when the IP already sent `limit` in the window.
function allow(ip: string, now = Date.now()) {
  const recent = (sent.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    sent.set(ip, recent);
    return false;
  }
  sent.set(ip, [...recent, now]);
  // Forget IPs that went quiet, so the map doesn't grow forever.
  if (sent.size > 10_000) for (const [key, times] of sent) if (times.every((t) => now - t >= windowMs)) sent.delete(key);
  return true;
}

// Cloudflare sets CF-Connecting-IP, and Traefik only lets Cloudflare connect (infra/edge, cloudflare-only), so it
// can be trusted. Dev has no Cloudflare: the socket address.
function clientIp(c: Context) {
  const cf = c.req.header("cf-connecting-ip");
  if (cf) return cf;
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown"; // app.request() in tests has no socket
  }
}

const view = (r: typeof requests.$inferSelect): ContactRequest => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  topic: r.topic,
  message: r.message,
  locale: r.locale,
  status: r.status,
  createdAt: r.createdAt.toISOString(),
});

async function notify(row: typeof requests.$inferSelect) {
  const siteUrl = bookingConfig().siteUrl;
  const coachEmail = process.env.HEAD_COACH_EMAIL?.toLowerCase();
  if (coachEmail) {
    // The coach reads it in their own language.
    const [coach] = await db().select({ locale: users.locale }).from(users).where(eq(users.email, coachEmail));
    const locale = coach?.locale ?? "sl";
    const props = {
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      topic: row.topic,
      message: row.message,
      requestUrl: `${siteUrl}/${locale}/coach/requests/${row.id}`,
    };
    await sendEmail({ to: coachEmail, locale, template: "contactReceived", props });
  } else {
    console.warn("requests: HEAD_COACH_EMAIL is not set, the coach gets no email (the request is in the inbox)");
  }
  await sendEmail({ to: row.email, locale: row.locale, template: "contactAutoReply", props: { name: row.name } });
}

export const contactRequests = new Hono()
  .post("/", validate("json", CreateRequestInput), async (c) => {
    if (!allow(clientIp(c))) {
      throw new ApiError(429, "too_many_requests", "You've sent several messages in the last hour. Please try again later, or call or email us.");
    }
    const { website, consent: _, phone, email, ...input } = c.req.valid("json");
    // A bot filled the hidden field: it sees the same success, nothing is stored or sent.
    if (website) return c.json({ ok: true as const });
    const [row] = await db()
      .insert(requests)
      .values({ ...input, email: email.toLowerCase(), phone: phone || null, consentedAt: new Date() })
      .returning();
    await notify(row!);
    return c.json({ ok: true as const });
  })
  .get("/", staff, validate("query", RequestsQuery), async (c) => {
    const { status } = c.req.valid("query");
    const rows = await db()
      .select()
      .from(requests)
      .where(status && eq(requests.status, status))
      .orderBy(desc(requests.createdAt))
      .limit(500);
    return c.json<ContactRequest[]>(rows.map(view));
  })
  .get("/:id", staff, validate("param", IdParam), async (c) => {
    const [row] = await db().select().from(requests).where(eq(requests.id, c.req.valid("param").id));
    if (!row) throw new ApiError(404, "not_found", "Request not found");
    return c.json<ContactRequest>(view(row));
  })
  .patch("/:id", staff, validate("param", IdParam), validate("json", UpdateRequestInput), async (c) => {
    const [row] = await db()
      .update(requests)
      .set({ status: c.req.valid("json").status })
      .where(eq(requests.id, c.req.valid("param").id))
      .returning();
    if (!row) throw new ApiError(404, "not_found", "Request not found");
    return c.json<ContactRequest>(view(row));
  });
