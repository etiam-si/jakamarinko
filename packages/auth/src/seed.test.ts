import { beforeEach, expect, test, vi } from "vitest";
import { coaches, locations, users } from "@jakamarinko/db/schema";
import { seed } from "./seed";
import { testDb } from "./test-db";

const holder = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));

let database: Awaited<ReturnType<typeof testDb>>;

beforeEach(async () => {
  database = await testDb();
  holder.db = database;
});

const env = { OWNER_EMAIL: "owner@example.com", HEAD_COACH_EMAIL: "jaka@example.com", LAB_ADDRESS: "Somewhere 1" };

test("running twice creates no duplicates", async () => {
  await seed(env);
  await seed(env);

  const people = await database.select({ email: users.email, role: users.role }).from(users).orderBy(users.email);
  expect(people).toEqual([
    { email: "jaka@example.com", role: "head_coach" },
    { email: "owner@example.com", role: "owner" },
  ]);
  expect(await database.select().from(coaches)).toHaveLength(1);
  const [lab, ...more] = await database.select().from(locations);
  expect(more).toHaveLength(0);
  expect(lab).toMatchObject({ name: "Jaka's home", address: "Somewhere 1", isDefault: true });
});

test("one person who is owner and head coach ends up owner, and the lab address can change", async () => {
  await seed({ ...env, OWNER_EMAIL: "jaka@example.com" });
  await seed({ LAB_ADDRESS: "Elsewhere 2" });

  expect(await database.select({ role: users.role }).from(users)).toEqual([{ role: "owner" }]);
  expect(await database.select().from(coaches)).toHaveLength(1);
  expect(await database.select({ address: locations.address }).from(locations)).toEqual([{ address: "Elsewhere 2" }]);
});

test("nothing set, nothing seeded", async () => {
  await seed({});
  expect(await database.select().from(users)).toHaveLength(0);
});
