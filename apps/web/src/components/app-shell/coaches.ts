import { headers } from "next/headers";
import { CoachSummary, roleAllows } from "@jakamarinko/api";
import type { Role } from "@jakamarinko/types";
import { api } from "@/lib/api";

export type Coach = CoachSummary;

// The calendars the signed-in coach may open, own first. Ids are coach ids (coaches.id), what ?coach= and the api's
// coachId mean, not user ids.
export async function getCoaches(): Promise<Coach[]> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await api.booking.coach.coaches.$get(undefined, { headers: { cookie } });
  if (!res.ok) throw new Error(`GET /api/booking/coach/coaches failed: ${res.status}`);
  return CoachSummary.array().parse(await res.json());
}

// Head coach and owner pick whose calendar they see, once there is more than one coach to pick from.
export const showCoachSwitcher = (role: Role, coaches: Coach[]) => roleAllows(role, ["head_coach"]) && coaches.length > 1;
