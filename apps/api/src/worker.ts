import "./env"; // fails fast on a bad environment
import { jobs } from "./jobs";
import { runJobs } from "./lib/run-jobs";

// Background jobs (reminders, the engine) in their own container, so a slow job never holds up a request.
const stop = runJobs(jobs);
console.log(`worker running ${jobs.length} job(s): ${jobs.map((j) => j.name).join(", ") || "none yet"}`);

// Keeps the process alive while no job is registered.
const keepAlive = setInterval(() => {}, 1 << 30);

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, async () => {
    clearInterval(keepAlive);
    await stop();
    process.exit(0);
  });
}
