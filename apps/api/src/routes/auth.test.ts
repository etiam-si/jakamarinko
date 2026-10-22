import { Hono } from "hono";
import { beforeEach, expect, test, vi } from "vitest";
import type { SessionUser } from "@jakamarinko/auth";
import type { Role } from "@jakamarinko/types";
import { app } from "../app";
import { requireRole } from "../lib/auth";
import { notFound, onError } from "../lib/errors";

const state = vi.hoisted(() => ({
  user: null as SessionUser | null,
  consents: { health_data: true, marketing: false },
  calls: [] as string[],
}));

vi.mock("@jakamarinko/auth", () => ({
  getSessionUser: async () => state.user,
  hasConsent: async (_id: string, kind: "health_data" | "marketing") => state.consents[kind],
  activeConsents: async () => state.consents,
  grantConsent: async (_id: string, kind: string) => void state.calls.push(`grant ${kind}`),
  withdrawConsent: async (_id: string, kind: string) => void state.calls.push(`withdraw ${kind}`),
  googleEnabled: () => false,
  auth: () => ({ handler: async () => new Response("better-auth") }),
}));
vi.mock("@jakamarinko/db", () => ({ db: () => ({}) }));

const signIn = (role: Role) => (state.user = { id: "u1", email: "a@example.com", name: "", role, locale: "en" });

beforeEach(() => {
  state.user = null;
  state.consents = { health_data: true, marketing: false };
  state.calls = [];
});

const coachOnly = new Hono().get("/", requireRole("coach"), (c) => c.json({ id: c.get("user").id }));
const guarded = new Hono().route("/coach", coachOnly);
guarded.onError(onError);
guarded.notFound(notFound);

test('requireRole("coach"): 401 without a session, 403 for a customer, 200 for coach, head_coach and owner', async () => {
  expect((await guarded.request("/coach")).status).toBe(401);

  signIn("customer");
  const customer = await guarded.request("/coach");
  expect(customer.status).toBe(403);
  expect(await customer.json()).toEqual({ error: { code: "forbidden", message: "Not allowed" } });

  for (const role of ["coach", "head_coach", "owner"] as const) {
    signIn(role);
    expect((await guarded.request("/coach")).status, role).toBe(200);
  }
});

test("requireRole: 403 consent_required without health data consent, even for staff", async () => {
  signIn("owner");
  state.consents.health_data = false;
  const res = await guarded.request("/coach");
  expect(res.status).toBe(403);
  expect(await res.json()).toMatchObject({ error: { code: "consent_required" } });
});

test("GET /api/auth/me", async () => {
  expect((await app.request("/api/auth/me")).status).toBe(401);
  signIn("customer");
  const res = await app.request("/api/auth/me");
  expect(await res.json()).toEqual({ user: state.user, consents: { health_data: true, marketing: false } });
});

test("POST /api/auth/consents grants and withdraws", async () => {
  signIn("customer");
  const post = (body: unknown) =>
    app.request("/api/auth/consents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  expect((await post({ kind: "marketing", granted: true })).status).toBe(200);
  expect((await post({ kind: "health_data", granted: false })).status).toBe(200);
  expect(state.calls).toEqual(["grant marketing", "withdraw health_data"]);
  expect((await post({ kind: "newsletter", granted: true })).status).toBe(400);
});

test("everything else under /api/auth goes to Better Auth", async () => {
  expect(await (await app.request("/api/auth/get-session")).text()).toBe("better-auth");
});
