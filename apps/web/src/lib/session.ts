import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isStaff, Me, roleAllows } from "@jakamarinko/api";
import type { Locale, Role } from "@jakamarinko/types";
import { redirect } from "@/i18n/navigation";
import { api } from "./api";

// Server only. The signed-in user and their consents, or null. Asked once per request.
export const getSession = cache(async (): Promise<Me | null> => {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await api.auth.me.$get(undefined, { headers: { cookie } });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /api/auth/me failed: ${res.status}`);
  return Me.parse(await res.json());
});

// For pages behind sign-in. No session: sign-in. No health data consent: the consent step.
// Wrong role: 404 (owner ⊇ head_coach ⊇ coach). `next` is where to come back to, without the locale.
export async function requireRole(locale: Locale, next: string, ...roles: Role[]) {
  const session = await getSession();
  if (!session) return redirect({ href: { pathname: "/sign-in", query: { next } }, locale });
  if (!session.consents.health_data) return redirect({ href: { pathname: "/consent", query: { next } }, locale });
  if (roles.length && !roleAllows(session.user.role, roles)) notFound();
  return session;
}

// Where someone lands after signing in when no page asked for it.
export const homeFor = (role: Role) => (isStaff(role) ? "/coach" : "/account");

// A `next` from the URL, only if it's a path on this site (never another origin).
export function safeNext(next: unknown) {
  return typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : undefined;
}
