import { z } from "zod";

// The legal pages are drafts until the user or a lawyer approves them and the server sets LEGAL_APPROVED=true.
const Flag = z.enum(["true", "false"]).default("false");

export function legalApproved(value = process.env.LEGAL_APPROVED): boolean {
  return Flag.parse(value || undefined) === "true";
}
