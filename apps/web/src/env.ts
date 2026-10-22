import { z } from "zod";

// Server-side env. Variables the browser needs must start with NEXT_PUBLIC_ and be listed by name,
// because Next only inlines process.env.NEXT_PUBLIC_X written out in full.
const Env = z.object({
  // This worktree's api in dev (scripts/worktree-env.sh); unused in production, where Traefik routes /api.
  API_URL: z.url().default("http://localhost:3001"),
});

export const env = Env.parse({ API_URL: process.env.API_URL });
