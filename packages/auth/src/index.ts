import type { Role, Locale } from "@jakamarinko/types";
import { auth } from "./auth";

export { auth, createAuth, googleEnabled, type Auth } from "./auth";
export { activeConsents, CONSENT_VERSION, grantConsent, hasConsent, withdrawConsent, type ConsentKind } from "./consents";
export { seed } from "./seed";

export type SessionUser = { id: string; email: string; name: string; role: Role; locale: Locale };

// The signed-in user for these request headers (session cookie or Authorization: Bearer), or null.
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  const session = await auth().api.getSession({ headers });
  if (!session) return null;
  const { id, email, name, role, locale } = session.user;
  return { id, email, name, role: role as Role, locale: locale as Locale };
}
