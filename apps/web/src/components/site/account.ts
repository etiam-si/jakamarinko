"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { isStaff } from "@jakamarinko/api";
import { roles } from "@jakamarinko/types";
import { initials } from "@/lib/initials";

// What the header shows about the signed-in person. Nothing health related: name, email, initials, staff or not.
export type HeaderAccount = { name: string; email: string; initials: string; staff: boolean };

// Better Auth's session endpoint: the user, or null without a session.
const Session = z
  .object({ user: z.object({ name: z.string().nullish(), email: z.string(), role: z.enum(roles).catch("customer") }) })
  .nullable();

// The public pages render statically, with "Sign in". The browser asks once per page load who is signed in, and the
// header swaps in the account when there is one. undefined: not known yet (and on the server). One request, shared
// by the header and the phone menu.
let account: HeaderAccount | null | undefined;
let started = false;
const listeners = new Set<() => void>();

function set(next: HeaderAccount | null) {
  account = next;
  for (const listener of listeners) listener();
}

async function load() {
  try {
    const res = await fetch("/api/auth/get-session", { credentials: "same-origin" });
    const session = res.ok ? Session.parse(await res.json()) : null;
    if (!session) return set(null);
    const { name, email, role } = session.user;
    set({ name: name ?? "", email, initials: initials(name ?? "", email), staff: isStaff(role) });
  } catch {
    set(null);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    void load();
  }
  return () => listeners.delete(listener);
}

export function useHeaderAccount() {
  return useSyncExternalStore(
    subscribe,
    () => account,
    () => undefined,
  );
}

// After signing out: the header shows "Sign in" again without asking.
export const forgetHeaderAccount = () => set(null);
