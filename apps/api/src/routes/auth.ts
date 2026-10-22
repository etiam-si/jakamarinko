import { Hono } from "hono";
import { ConsentInput, type AuthProviders, type Me } from "@jakamarinko/api";
import { activeConsents, auth as betterAuth, googleEnabled, grantConsent, withdrawConsent } from "@jakamarinko/auth";
import { requireSession } from "../lib/auth";
import { validate } from "../lib/validate";

// Our own endpoints first; everything else under /api/auth is Better Auth (sign-in, callbacks, sign-out, sessions).
export const auth = new Hono()
  .get("/me", requireSession, async (c) => {
    const user = c.get("user");
    return c.json<Me>({ user, consents: await activeConsents(user.id) });
  })
  .get("/providers", (c) => c.json<AuthProviders>({ google: googleEnabled() }))
  .post("/consents", requireSession, validate("json", ConsentInput), async (c) => {
    const { kind, granted } = c.req.valid("json");
    const user = c.get("user");
    await (granted ? grantConsent : withdrawConsent)(user.id, kind);
    return c.json<Me["consents"]>(await activeConsents(user.id));
  })
  .on(["GET", "POST"], "/*", (c) => betterAuth().handler(c.req.raw));
