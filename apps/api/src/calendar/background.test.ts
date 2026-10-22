import { expect, test } from "vitest";
import { idle, inBackground, inOrder } from "./background";

const later = <T>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

test("work under one key runs one at a time, in the order it was queued, even when the first is slower", async () => {
  const done: string[] = [];
  const first = inOrder("booking:1", async () => done.push(await later(30, "first")));
  const second = inOrder("booking:1", async () => done.push(await later(1, "second")));
  await Promise.all([first, second]);
  expect(done).toEqual(["first", "second"]);
});

test("a failure doesn't stop the next one under the same key", async () => {
  const failed = inOrder("booking:2", async () => Promise.reject(new Error("Google is down")));
  await expect(failed).rejects.toThrow("Google is down");
  expect(await inOrder("booking:2", async () => "pushed")).toBe("pushed");
});

test("idle waits for background work and queued work", async () => {
  let finished = 0;
  inBackground(later(20, null).then(() => finished++));
  void inOrder("booking:3", async () => {
    await later(10, null);
    finished++;
  });
  await idle();
  expect(finished).toBe(2);
});
