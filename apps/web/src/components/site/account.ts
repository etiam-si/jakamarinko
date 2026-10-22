import { cookies } from "next/headers";
import { isStaff } from "@jakamarinko/api";
import { initials } from "@/lib/initials";
import { getSession } from "@/lib/session";

// What the header shows about the signed-in person. Nothing health related: name, email, initials, staff or not.
export type HeaderAccount = { name: string; email: string; initials: string; staff: boolean };

// Server only. Without a session cookie there is nobody to ask about, so most visitors cost no api call. An api that
// can't be reached shows the header signed out rather than breaking the page.
export async function headerAccount(): Promise<HeaderAccount | null> {
  const hasSession = (await cookies()).getAll().some((c) => c.name.endsWith("session_token"));
  if (!hasSession) return null;
  const session = await getSession().catch(() => null);
  if (!session) return null;
  const { name, email, role } = session.user;
  return { name, email, initials: initials(name, email), staff: isStaff(role) };
}
