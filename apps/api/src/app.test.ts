import { Hono } from "hono";
import { expect, test, vi } from "vitest";
import { z } from "zod";
import { ApiErrorBody } from "@jakamarinko/api";
import { app } from "./app";
import { ApiError, notFound, onError } from "./lib/errors";
import { validate } from "./lib/validate";

vi.mock("@jakamarinko/db", () => ({ db: () => ({ execute: async () => ({ rows: [] }) }) }));

test("GET /api/health", async () => {
  const res = await app.request("/api/health");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true, service: "api" });
});

test("an unknown route is a JSON 404", async () => {
  const res = await app.request("/api/nope");
  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ error: { code: "not_found", message: "Not found" } });
});

const sub = new Hono()
  .get("/teapot", () => {
    throw new ApiError(418, "teapot", "I am a teapot");
  })
  .get("/crash", () => {
    throw new Error("secret detail");
  })
  .post("/echo", validate("json", z.object({ heartRate: z.number() })), (c) => c.json(c.req.valid("json")));
const parent = new Hono().route("/x", sub);
parent.onError(onError);
parent.notFound(notFound);

test("errors from sub-apps come back as { error: { code, message } }", async () => {
  const teapot = await parent.request("/x/teapot");
  expect(teapot.status).toBe(418);
  expect(await teapot.json()).toEqual({ error: { code: "teapot", message: "I am a teapot" } });

  vi.spyOn(console, "error").mockImplementation(() => {});
  const crash = await parent.request("/x/crash");
  expect(crash.status).toBe(500);
  expect(await crash.json()).toEqual({ error: { code: "internal", message: "Something went wrong" } });
});

test("invalid input names the field, not the value", async () => {
  const res = await parent.request("/x/echo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ heartRate: "182 bpm" }),
  });
  expect(res.status).toBe(400);
  const { error } = ApiErrorBody.parse(await res.json());
  expect(error.code).toBe("invalid_input");
  expect(error.message).toContain("heartRate");
  expect(error.message).not.toContain("182");
});
