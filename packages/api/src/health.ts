import { z } from "zod";

export const Health = z.object({ ok: z.literal(true), service: z.string() });
export type Health = z.infer<typeof Health>;
