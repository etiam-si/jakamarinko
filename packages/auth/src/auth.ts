import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, magicLink } from "better-auth/plugins";
import { db } from "@jakamarinko/db";
import * as schema from "@jakamarinko/db/schema";
import { sendEmail } from "@jakamarinko/email";
import { defaultLocale, roles } from "@jakamarinko/types";
import { readEnv, type AuthEnv } from "./env";
import { localeFromContext } from "./locale";
import { magicLinkEmail } from "./magic-link-email";

export function createAuth(env: AuthEnv = readEnv()) {
  return betterAuth({
    appName: "Jaka Marinko",
    baseURL: env.baseURL,
    basePath: "/api/auth",
    secret: env.secret,
    database: drizzleAdapter(db(), {
      provider: "pg",
      usePlural: true,
      schema: { users: schema.users, sessions: schema.sessions, accounts: schema.accounts, verifications: schema.verifications },
    }),
    user: {
      additionalFields: {
        role: { type: [...roles], input: false, defaultValue: "customer" },
        locale: { type: "string", input: false, defaultValue: defaultLocale },
      },
    },
    socialProviders: env.google ? { google: { ...env.google, prompt: "select_account" } } : {},
    // Google verifies the email, so signing in with Google joins an account first made with a magic link.
    account: { accountLinking: { trustedProviders: ["google"] } },
    databaseHooks: {
      user: { create: { before: async (user, ctx) => ({ data: { ...user, locale: localeFromContext(ctx) } }) } },
    },
    // No cookie domain is set, so cookies stay on the exact host (jakamarinko.com). Secure when the URL is https.
    // Rate limits are per client IP. Cloudflare sets CF-Connecting-IP (overwriting any the client sent), and Traefik
    // only lets Cloudflare connect (infra/edge, cloudflare-only). X-Forwarded-For arrives as "client, cloudflare",
    // which Better Auth rightly won't trust, so it would put everyone in one bucket.
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    telemetry: { enabled: false },
    plugins: [
      magicLink({
        expiresIn: 15 * 60,
        sendMagicLink: async ({ email, url }, ctx) => {
          const message = magicLinkEmail(localeFromContext(ctx), email, url);
          const sent = await sendEmail({ to: email, locale: localeFromContext(ctx), ...message });
          if (!sent.ok) throw new Error(`magic link email failed: ${sent.error}`);
        },
      }),
      // Session tokens in an Authorization header, for the Expo app later.
      bearer(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

// Built on first use, like db().
export function auth() {
  instance ??= createAuth();
  return instance;
}

export function googleEnabled() {
  return !!readEnv().google;
}
