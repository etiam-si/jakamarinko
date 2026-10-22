import { z } from "zod";
import { locales, roles, type Role } from "@jakamarinko/types";

export const ConsentKind = z.enum(["health_data", "marketing"]);
export type ConsentKind = z.infer<typeof ConsentKind>;

// POST /api/auth/consents. granted: false withdraws the active grant.
export const ConsentInput = z.object({ kind: ConsentKind, granted: z.boolean() });
export type ConsentInput = z.infer<typeof ConsentInput>;

// GET /api/auth/me: the signed-in user and which consents are active.
export const Me = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.enum(roles),
    locale: z.enum(locales),
  }),
  consents: z.record(ConsentKind, z.boolean()),
});
export type Me = z.infer<typeof Me>;

// GET /api/auth/providers: which sign-in methods are set up on this server.
export const AuthProviders = z.object({ google: z.boolean() });
export type AuthProviders = z.infer<typeof AuthProviders>;

const staff: Role[] = ["coach", "head_coach", "owner"];

// owner ⊇ head_coach ⊇ coach. Customers and athletes match only themselves.
export function roleAllows(role: Role, allowed: readonly Role[]) {
  if (allowed.includes(role)) return true;
  const rank = staff.indexOf(role);
  return rank >= 0 && allowed.some((a) => staff.includes(a) && staff.indexOf(a) <= rank);
}

export const isStaff = (role: Role) => staff.includes(role);
