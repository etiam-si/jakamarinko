import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { ApiError } from "./errors";

// zValidator with our error body. The message names the fields, never the values sent.
export const validate = <T extends keyof ValidationTargets, S extends ZodType>(target: T, schema: S) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      const fields = result.error.issues.map((i) => `${i.path.join(".") || target}: ${i.message}`);
      throw new ApiError(400, "invalid_input", fields.join("; "));
    }
  });
