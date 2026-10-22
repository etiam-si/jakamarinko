import { beforeAll, expect, test, vi } from "vitest";
import { setTransport } from "@jakamarinko/email";
import { createAuth } from "./auth";
import { readEnv } from "./env";
import { testDb } from "./test-db";

const holder = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));
// Better Auth only rate-limits in production; switch it on with the real config otherwise unchanged.
vi.mock("better-auth", async (original) => {
  const mod = await original<typeof import("better-auth")>();
  return { ...mod, betterAuth: ((options) => mod.betterAuth({ ...options, rateLimit: { enabled: true } })) as typeof mod.betterAuth };
});

const origin = "http://localhost:3000";
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
  holder.db = await testDb();
  setTransport(async () => ({ ok: true, id: "1" }));
  auth = createAuth(readEnv({ WEB_PORT: "3000" }));
});

// What Cloudflare and Traefik send: CF-Connecting-IP, and X-Forwarded-For as "client, cloudflare".
const signIn = (ip: string, forwardedFor = `${ip}, 172.68.1.1`) =>
  auth.handler(
    new Request(`${origin}/api/auth/sign-in/magic-link`, {
      method: "POST",
      headers: { "content-type": "application/json", origin, "cf-connecting-ip": ip, "x-forwarded-for": forwardedFor },
      body: JSON.stringify({ email: "rate@example.com", callbackURL: "/en/sign-in/continue" }),
    }),
  );

// Sends until the limit hits; returns how many got through.
async function exhaust(ip: string) {
  for (let i = 0; i < 20; i++) {
    const { status } = await signIn(ip);
    if (status === 429) return i;
    expect(status).toBe(200);
  }
  throw new Error("never rate limited");
}

test("sign-in is rate limited per client IP (CF-Connecting-IP), so one person can't block everyone", async () => {
  expect(await exhaust("198.51.100.1")).toBeGreaterThan(0);
  expect((await signIn("198.51.100.1")).status).toBe(429);
  // Someone else, a moment later: their own bucket.
  expect((await signIn("198.51.100.2")).status).toBe(200);
  // A made-up X-Forwarded-For doesn't move you to another bucket; Cloudflare overwrites CF-Connecting-IP.
  expect((await signIn("198.51.100.1", "203.0.113.9")).status).toBe(429);
});
