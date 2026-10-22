import { createApiClient } from "@jakamarinko/api";
import { env } from "@/env";

// The typed api client. In the browser /api goes through this origin; on the server straight to the api.
export const api = createApiClient(typeof window === "undefined" ? env.API_URL : "");
