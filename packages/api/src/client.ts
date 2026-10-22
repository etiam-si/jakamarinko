import { hc } from "hono/client";
// A relative type-only import: depending on the api app as a package would make a workspace cycle.
import type { AppType } from "../../../apps/api/src/app";

// Typed client for web and mobile. Browser: createApiClient(""), the web server proxies /api.
// Server side and mobile: an absolute origin, e.g. createApiClient("https://jakamarinko.com").
export function createApiClient(origin: string, options?: Parameters<typeof hc>[1]) {
  return hc<AppType>(origin, options).api;
}

export type ApiClient = ReturnType<typeof createApiClient>;
