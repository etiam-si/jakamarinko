import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isStaff, Me, roleAllows } from "@jakamarinko/api";
import type { Locale, Role } from "@jakamarinko/types";
import { redirect } from "@/i18n/navigation";
import { api } from "./api";
import { requestUrlHeader } from "./request-url";

// Server only. The signed-in user and their consents, or null. Asked once per request.
export const getSession = cache(async (): Promise<Me | null> => {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await api.auth.me.$get(undefined, { headers: { cookie } });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /api/auth/me failed: ${res.status}`);
  return Me.parse(await res.json());
});

// For pages behind sign-in: the session, or off to sign-in. `next` is where to come back to, without the locale.
export async function requireSignIn(locale: Locale, next: string) {
  const session = await getSession();
  if (!session) return redirect({ href: { pathname: "/sign-in", query: { next } }, locale });
  return session;
}

// requireSignIn, then: no health data consent sends to the consent step, the wrong role gets a 404
// (owner ⊇ head_coach ⊇ coach).
export async function requireRole(locale: Locale, next: string, ...roles: Role[]) {
  const session = await requireSignIn(locale, next);
  if (!session.consents.health_data) return redirect({ href: { pathname: "/consent", query: { next } }, locale });
  if (roles.length && !roleAllows(session.user.role, roles)) notFound();
  return session;
}

// Where someone lands after signing in when no page asked for it.
export const homeFor = (role: Role) => (isStaff(role) ? "/coach" : "/account");

// A `next` from the URL, only if it's a path on this site (never another origin). No whitespace or control
// characters either: browsers drop tabs and newlines, so "/\t/evil.example" would become "//evil.example".
export function safeNext(next: unknown) {
  return typeof next === "string" && /^\/(?![/\\])[^\s\x00-\x1f\x7f]*$/.test(next) ? next : undefined;
}

// The page this request asked for, without the locale, as a `next` (query included, so a link's token survives
// sign-in). The fallback when there is none or it isn't a safe path.
export async function requestedPath(locale: Locale, fallback: string) {
  const url = (await headers()).get(requestUrlHeader) ?? "";
  const path = url.startsWith(`/${locale}/`) || url.startsWith(`/${locale}?`) ? url.slice(locale.length + 1) : url;
  return safeNext(path) ?? fallback;
}
