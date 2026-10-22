import { beforeAll, expect, test, vi } from "vitest";
import { consents, users } from "@jakamarinko/db/schema";
import { activeConsents, grantConsent, withdrawConsent } from "./consents";
import { testDb } from "./test-db";

const holder = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));

let database: Awaited<ReturnType<typeof testDb>>;

beforeAll(async () => {
  database = await testDb();
  holder.db = database;
  await database.insert(users).values({ id: "u1", name: "", email: "a@example.com" });
});

test("granting twice keeps one active row; withdrawing keeps the row and sets withdrawn_at", async () => {
  await grantConsent("u1", "health_data");
  await grantConsent("u1", "health_data");
  expect(await activeConsents("u1")).toEqual({ health_data: true, marketing: false });

  await withdrawConsent("u1", "health_data");
  expect(await activeConsents("u1")).toEqual({ health_data: false, marketing: false });
  const [row, ...rest] = await database.select().from(consents);
  expect(rest).toHaveLength(0);
  expect(row!.withdrawnAt).toBeInstanceOf(Date);
  expect(row!.version).toBeTruthy();

  await grantConsent("u1", "health_data");
  expect(await database.select().from(consents)).toHaveLength(2);
  expect(await activeConsents("u1")).toEqual({ health_data: true, marketing: false });
});
