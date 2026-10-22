import { type Me, roleAllows } from "@jakamarinko/api";
import type { Role } from "@jakamarinko/types";

export type Coach = { id: string; name: string };

// Active coaches, for the head coach's calendar switcher. Stub: no api lists the `coaches` table yet (T10 PR,
// "Blocked / needs"), and today Jaka is the only coach, so it's just the signed-in user.
export async function getCoaches(session: Me): Promise<Coach[]> {
  return [{ id: session.user.id, name: session.user.name || session.user.email }];
}

// Head coach and owner pick whose calendar they see, once there is more than one coach to pick from.
export const showCoachSwitcher = (role: Role, coaches: Coach[]) => roleAllows(role, ["head_coach"]) && coaches.length > 1;
