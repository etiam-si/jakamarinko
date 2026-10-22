import { createMiddleware } from "hono/factory";
import { roleAllows } from "@jakamarinko/api";
import { getSessionUser, hasConsent, type SessionUser } from "@jakamarinko/auth";
import type { Role } from "@jakamarinko/types";
import { ApiError } from "./errors";

type Env = { Variables: { user: SessionUser } };

// 401 without a session. Sets c.var.user.
export const requireSession = createMiddleware<Env>(async (c, next) => {
  const user = await getSessionUser(c.req.raw.headers);
  if (!user) throw new ApiError(401, "unauthorized", "Sign in first");
  c.set("user", user);
  await next();
});

// 401 without a session, 403 without health data consent or the role (owner ⊇ head_coach ⊇ coach).
export const requireRole = (...roles: Role[]) =>
  createMiddleware<Env>(async (c, next) => {
    const user = await getSessionUser(c.req.raw.headers);
    if (!user) throw new ApiError(401, "unauthorized", "Sign in first");
    if (!(await hasConsent(user.id, "health_data"))) throw new ApiError(403, "consent_required", "Consent required");
    if (!roleAllows(user.role, roles)) throw new ApiError(403, "forbidden", "Not allowed");
    c.set("user", user);
    await next();
  });
