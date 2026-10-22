import { DrizzleQueryError } from "drizzle-orm/errors";
import { expect, test } from "vitest";
import { loggable } from "./errors";

const pgError = Object.assign(new Error("duplicate key value violates unique constraint"), { code: "23505" });
const failed = () => new DrizzleQueryError("insert into bookings (health_answers) values ($1)", ['{"chest_pain":"yes"}'], pgError);

test("a failed query is logged without its parameters", () => {
  const line = loggable(failed());
  expect(line).toBe("database query failed (postgres 23505): insert into bookings (health_answers) values ($1)");
  expect(line).not.toContain("chest_pain");
});

test("also when the failed query is the cause of another error", () => {
  expect(loggable(new Error("transaction failed", { cause: failed() }))).not.toContain("chest_pain");
});

test("other errors keep their stack", () => {
  expect(loggable(new Error("boom"))).toContain("Error: boom");
  expect(loggable("plain")).toBe("plain");
});
