import { beforeAll, expect, test, vi } from "vitest";
import { users } from "@jakamarinko/db/schema";
import { setTransport, type RenderedEmail } from "@jakamarinko/email";
import { createAuth } from "./auth";
import { readEnv } from "./env";
import { localeFromContext } from "./locale";
import { testDb } from "./test-db";

const holder = vi.hoisted(() => ({ db: undefined as unknown }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));

const outbox: RenderedEmail[] = [];
let database: Awaited<ReturnType<typeof testDb>>;

beforeAll(async () => {
  database = await testDb();
  holder.db = database;
  setTransport(async (email) => {
    outbox.push(email);
    return { ok: true, id: String(outbox.length) };
  });
});

const origin = "http://localhost:3000";
const auth = () => createAuth(readEnv({ WEB_PORT: "3000" }));

test("magic link: the email goes out in the page's language, and the new user gets that locale", async () => {
  const res = await auth().handler(
    new Request(`${origin}/api/auth/sign-in/magic-link`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email: "Ana@Example.com", callbackURL: "/sl/sign-in/continue" }),
    }),
  );
  expect(res.status).toBe(200);
  const email = outbox.at(-1)!;
  expect(email).toMatchObject({ to: "Ana@Example.com", locale: "sl", subject: "Tvoja povezava za prijavo" });

  const link = /href="([^"]+)"/.exec(email.html)![1]!.replaceAll("&amp;", "&");
  expect(link.startsWith(`${origin}/api/auth/magic-link/verify?`)).toBe(true);

  const verified = await auth().handler(new Request(link));
  expect(verified.status).toBe(302);
  expect(verified.headers.get("location")).toBe(`${origin}/sl/sign-in/continue`);
  expect(verified.headers.get("set-cookie")).toContain("better-auth.session_token=");
  expect(verified.headers.get("set-cookie")).not.toMatch(/domain=/i);

  const [user] = await database.select().from(users);
  expect(user).toMatchObject({ email: "ana@example.com", locale: "sl", role: "customer" });
});

test("a used magic link doesn't work twice", async () => {
  await auth().handler(
    new Request(`${origin}/api/auth/sign-in/magic-link`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email: "bo@example.com", callbackURL: "/en/sign-in/continue", errorCallbackURL: "/en/sign-in" }),
    }),
  );
  const link = /href="([^"]+)"/.exec(outbox.at(-1)!.html)![1]!.replaceAll("&amp;", "&");
  await auth().handler(new Request(link));
  const again = await auth().handler(new Request(link));
  expect(again.headers.get("location")).toMatch(/\/en\/sign-in\?error=/);
});

test("locale: callback URL first, then the NEXT_LOCALE cookie, then English", () => {
  expect(localeFromContext({ query: { callbackURL: "/sl/account" } })).toBe("sl");
  expect(localeFromContext({ body: { callbackURL: "http://localhost:3000/en/x" } })).toBe("en");
  expect(localeFromContext({ headers: new Headers({ cookie: "a=1; NEXT_LOCALE=sl" }) })).toBe("sl");
  expect(localeFromContext({ headers: new Headers({ cookie: "NEXT_LOCALE=de" }) })).toBe("en");
  expect(localeFromContext(null)).toBe("en");
});

test("production needs a secret and a URL", () => {
  expect(() => readEnv({ NODE_ENV: "production" })).toThrow(/BETTER_AUTH_SECRET[\s\S]*BETTER_AUTH_URL/);
  expect(readEnv({ GOOGLE_CLIENT_ID: "id" }).google).toBeUndefined();
});
