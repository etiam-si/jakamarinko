import { z } from "zod";

export type CoachSearch = Promise<Record<string, string | string[] | undefined>>;

// The calendar picked in T10's switcher: ?coach=<coach id>. Anything else means the signed-in coach's own.
export async function coachParam(searchParams: CoachSearch) {
  const parsed = z.uuid().safeParse((await searchParams).coach);
  return parsed.success ? parsed.data : undefined;
}
