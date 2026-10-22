import { eq } from "drizzle-orm";
import { roleAllows } from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import { db } from "@jakamarinko/db";
import { coaches } from "@jakamarinko/db/schema";
import { ApiError } from "../lib/errors";

// The signed-in user's own coach id, if they have a calendar.
export async function ownCoachId(user: SessionUser) {
  const [own] = await db().select({ id: coaches.id }).from(coaches).where(eq(coaches.userId, user.id));
  return own?.id;
}

// A coach works on their own calendar; head_coach and owner on anyone's. Throws 403 or 404 otherwise.
export async function assertCoachAccess(user: SessionUser, coachId: string) {
  if (coachId === (await ownCoachId(user))) return coachId;
  if (!roleAllows(user.role, ["head_coach"])) throw new ApiError(403, "forbidden", "Not your calendar");
  const [coach] = await db().select({ id: coaches.id }).from(coaches).where(eq(coaches.id, coachId));
  if (!coach) throw new ApiError(404, "unknown_coach", "Coach not found");
  return coachId;
}

// The calendar a request is about: the one named in coachId, else the user's own.
export async function targetCoach(user: SessionUser, coachId: string | undefined) {
  if (coachId) return assertCoachAccess(user, coachId);
  const own = await ownCoachId(user);
  if (!own) throw new ApiError(404, "not_a_coach", "You have no calendar; pass coachId");
  return own;
}
