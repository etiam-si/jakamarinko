export type Job = {
  name: string;
  everyMs: number;
  // Must be safe to run again after a crash or restart (idempotent).
  run: () => Promise<void>;
};

// Each job runs right away and then every `everyMs`. A run never overlaps the previous run of the same job,
// and a failing run is logged and retried on the next tick. Returns stop(), which waits for running jobs.
export function runJobs(jobs: Job[], log: Pick<Console, "error"> = console) {
  const running = new Map<string, Promise<void>>();
  let stopped = false;

  const tick = (job: Job) => {
    if (stopped || running.has(job.name)) return;
    const run = job
      .run()
      .catch((err: unknown) => log.error(`job ${job.name} failed: ${err instanceof Error ? err.message : String(err)}`))
      .finally(() => running.delete(job.name));
    running.set(job.name, run);
  };

  const timers = jobs.map((job) => {
    tick(job);
    return setInterval(() => tick(job), job.everyMs);
  });

  return async () => {
    stopped = true;
    timers.forEach(clearInterval);
    await Promise.all(running.values());
  };
}
