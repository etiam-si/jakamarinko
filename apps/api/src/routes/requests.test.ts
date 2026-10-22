import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiErrorBody, ContactRequest } from "@jakamarinko/api";
import type { SessionUser } from "@jakamarinko/auth";
import { requests } from "@jakamarinko/db/schema";
import { setTransport, type RenderedEmail } from "@jakamarinko/email";
import { app } from "../app";
import { people, seedFixtures, testDb } from "../booking/test-db";
import { resetRateLimit } from "./requests";

const holder = vi.hoisted(() => ({ db: undefined as unknown, user: null as SessionUser | null }));
vi.mock("@jakamarinko/db", () => ({ db: () => holder.db }));
vi.mock("@jakamarinko/auth", () => ({
  getSessionUser: async () => holder.user,
  hasConsent: async () => true,
}));

let database: Awaited<ReturnType<typeof testDb>>;
const outbox: RenderedEmail[] = [];

beforeAll(async () => {
  database = await testDb();
  holder.db = database;
  await seedFixtures();
  setTransport(async (email) => {
    outbox.push(email);
    return { ok: true, id: String(outbox.length) };
  });
});

beforeEach(async () => {
  vi.stubEnv("HEAD_COACH_EMAIL", people.jaka.email);
  holder.user = null;
  outbox.length = 0;
  resetRateLimit();
  await database.delete(requests);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const as = (user: SessionUser | null) => (holder.user = user);
const send = (method: string, path: string, body?: unknown, ip = "203.0.113.7") =>
  app.request(`/api/requests${path}`, {
    method,
    headers: { "cf-connecting-ip": ip, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const form = (overrides: Record<string, unknown> = {}) => ({
  name: "Ana Novak",
  email: "Ana@Example.com",
  phone: "",
  topic: "lab_test",
  message: "Rada bi naredila laktatni test.",
  locale: "sl",
  consent: true,
  website: "",
  ...overrides,
});

describe("POST /api/requests", () => {
  test("stores the request, emails the head coach and auto-replies in the sender's language", async () => {
    const res = await send("POST", "", form());
    expect(res.status).toBe(200);
    const [row] = await database.select().from(requests);
    expect(row).toMatchObject({ email: "ana@example.com", phone: null, topic: "lab_test", locale: "sl", status: "new" });
    expect(row!.consentedAt).toBeInstanceOf(Date);

    expect(outbox.map((e) => [e.to, e.locale])).toEqual([
      ["jaka@example.com", "en"],
      ["ana@example.com", "sl"],
    ]);
    const [coach, reply] = outbox;
    expect(coach!.subject).toBe("New message from Ana Novak");
    expect(coach!.html).toContain(`/en/coach/requests/${row!.id}`);
    expect(coach!.text).toContain("laktatni test");
    // The auto-reply doesn't repeat the message.
    expect(reply!.text).not.toContain("laktatni test");
  });

  test("without HEAD_COACH_EMAIL: stored, auto-reply sent, a warning instead of the coach email", async () => {
    vi.stubEnv("HEAD_COACH_EMAIL", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await send("POST", "", form())).status).toBe(200);
    expect(await database.select().from(requests)).toHaveLength(1);
    expect(outbox.map((e) => e.to)).toEqual(["ana@example.com"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("HEAD_COACH_EMAIL"));
    warn.mockRestore();
  });

  test("a filled honeypot gets a 200, but nothing is stored or sent", async () => {
    const res = await send("POST", "", form({ website: "https://spam.example" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(await database.select().from(requests)).toEqual([]);
    expect(outbox).toEqual([]);
  });

  test("the 6th submission from one IP within an hour is a 429; other IPs and the next hour are fine", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-02T10:00:00Z") });
    for (let i = 0; i < 5; i++) expect((await send("POST", "", form())).status).toBe(200);
    const sixth = await send("POST", "", form());
    expect(sixth.status).toBe(429);
    expect(ApiErrorBody.parse(await sixth.json()).error).toMatchObject({
      code: "too_many_requests",
      message: expect.stringMatching(/try again later/),
    });
    expect(await database.select().from(requests)).toHaveLength(5);

    expect((await send("POST", "", form(), "198.51.100.1")).status).toBe(200);
    vi.setSystemTime(new Date("2026-11-02T11:00:01Z"));
    expect((await send("POST", "", form())).status).toBe(200);
  });

  test("input is validated: consent is required, bad email, short phone, unknown topic and empty message are rejected", async () => {
    expect((await send("POST", "", form({ consent: false }))).status).toBe(400);
    expect((await send("POST", "", form({ email: "nope" }))).status).toBe(400);
    expect((await send("POST", "", form({ phone: "12" }))).status).toBe(400);
    expect((await send("POST", "", form({ topic: "yoga" }))).status).toBe(400);
    expect((await send("POST", "", form({ message: "   " }))).status).toBe(400);
    expect(await database.select().from(requests)).toEqual([]);
  });
});

describe("inbox", () => {
  async function submitted() {
    await send("POST", "", form());
    await send("POST", "", form({ name: "Bo", email: "bo@example.com", topic: "coaching", locale: "en" }));
    as(people.maja);
    return ContactRequest.array().parse(await (await send("GET", "")).json());
  }

  test("guests get 401 and customers 403 on every inbox route", async () => {
    const [first] = await submitted();
    for (const user of [null, people.ana]) {
      as(user);
      const status = user ? 403 : 401;
      expect((await send("GET", "")).status).toBe(status);
      expect((await send("GET", `/${first!.id}`)).status).toBe(status);
      expect((await send("PATCH", `/${first!.id}`, { status: "done" })).status).toBe(status);
    }
  });

  test("a coach lists newest first, filters by status, opens one and changes its status", async () => {
    const list = await submitted();
    expect(list.map((r) => r.name)).toEqual(["Bo", "Ana Novak"]);
    const ana = list[1]!;

    const res = await send("PATCH", `/${ana.id}`, { status: "answered" });
    expect(res.status).toBe(200);
    expect(ContactRequest.parse(await res.json()).status).toBe("answered");

    const only = async (status: string) =>
      ContactRequest.array()
        .parse(await (await send("GET", `?status=${status}`)).json())
        .map((r) => r.name);
    expect(await only("new")).toEqual(["Bo"]);
    expect(await only("answered")).toEqual(["Ana Novak"]);
    expect(await only("done")).toEqual([]);
    expect((await send("GET", "?status=spam")).status).toBe(400);

    expect(ContactRequest.parse(await (await send("GET", `/${ana.id}`)).json())).toMatchObject({ email: "ana@example.com", status: "answered" });
    expect((await send("GET", "/00000000-0000-4000-8000-000000000000")).status).toBe(404);
    expect((await send("PATCH", `/${ana.id}`, { status: "spam" })).status).toBe(400);
  });
});
