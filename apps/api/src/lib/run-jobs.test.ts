import { afterEach, expect, test, vi } from "vitest";
import { runJobs } from "./run-jobs";

afterEach(() => vi.useRealTimers());

test("runs a job right away and then on every interval", async () => {
  vi.useFakeTimers();
  const run = vi.fn(async () => {});
  const stop = runJobs([{ name: "a", everyMs: 1000, run }]);

  await vi.advanceTimersByTimeAsync(2500);
  expect(run).toHaveBeenCalledTimes(3);

  await stop();
  await vi.advanceTimersByTimeAsync(5000);
  expect(run).toHaveBeenCalledTimes(3);
});

test("never overlaps a slow run, and stop() waits for it", async () => {
  vi.useFakeTimers();
  let finish = () => {};
  const run = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
  const stop = runJobs([{ name: "slow", everyMs: 100, run }]);

  await vi.advanceTimersByTimeAsync(1000);
  expect(run).toHaveBeenCalledTimes(1);

  let stopped = false;
  const stopping = stop().then(() => (stopped = true));
  await Promise.resolve();
  expect(stopped).toBe(false);
  finish();
  await stopping;
  expect(stopped).toBe(true);
});

test("a failing run is logged and retried", async () => {
  vi.useFakeTimers();
  const log = { error: vi.fn() };
  const run = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue(undefined);
  const stop = runJobs([{ name: "flaky", everyMs: 100, run }], log);

  await vi.advanceTimersByTimeAsync(150);
  expect(log.error).toHaveBeenCalledWith("job flaky failed: boom");
  expect(run).toHaveBeenCalledTimes(2);
  await stop();
});
