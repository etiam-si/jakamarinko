import { z } from "zod";

// Imported only by the entry points (index.ts, worker.ts), so tests can build the app without a full environment.
const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Production sets PORT; in dev the worktree's API_PORT from .env.local wins, because web reads PORT too.
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.url({ error: "DATABASE_URL is not set (run scripts/worktree-env.sh in dev)" }),
  // The api image ships migrations here; from source the db package finds its own folder.
  MIGRATIONS_DIR: z.string().optional(),
});

export const env = Env.parse({ ...process.env, PORT: process.env.API_PORT ?? process.env.PORT });
