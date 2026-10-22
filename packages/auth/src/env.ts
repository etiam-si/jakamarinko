import { z } from "zod";

const devSecret = "dev-only-secret-never-used-in-production-0000";

// Read when the auth instance is first built, so importing this package needs no environment.
const Env = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // The site's public origin: links in emails and OAuth redirects point here, and /api is proxied from it.
    // Dev default: this worktree's web server (scripts/worktree-env.sh).
    BETTER_AUTH_URL: z.url().optional(),
    WEB_PORT: z.coerce.number().int().positive().default(3000),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    // Both or neither; without them the Google button is hidden.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  })
  .transform((env, ctx) => {
    const production = env.NODE_ENV === "production";
    if (production && !env.BETTER_AUTH_SECRET) ctx.addIssue({ code: "custom", message: "BETTER_AUTH_SECRET is not set" });
    if (production && !env.BETTER_AUTH_URL) ctx.addIssue({ code: "custom", message: "BETTER_AUTH_URL is not set" });
    const google =
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
        : undefined;
    return {
      baseURL: env.BETTER_AUTH_URL ?? `http://localhost:${env.WEB_PORT}`,
      secret: env.BETTER_AUTH_SECRET ?? devSecret,
      google,
    };
  });

export type AuthEnv = z.infer<typeof Env>;

export const readEnv = (source: NodeJS.ProcessEnv = process.env): AuthEnv => Env.parse(source);
