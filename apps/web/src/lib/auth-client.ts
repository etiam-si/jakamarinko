import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Browser only: talks to /api/auth on this origin (proxied to the api in dev, routed by Traefik on the server).
export const authClient = createAuthClient({ plugins: [magicLinkClient()] });
