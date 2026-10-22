// Calendar work that runs after the response has gone out. Kept here so it can be put in order and waited for.
const pending = new Set<Promise<unknown>>();
const queues = new Map<string, Promise<unknown>>();

// Starts `work` in the background. It must handle its own errors.
export function inBackground(work: Promise<unknown>) {
  pending.add(work);
  void work.finally(() => pending.delete(work));
}

// Runs `work` after everything queued before it under the same key, so two syncs of one booking never overlap and
// the later change is the one that ends up in Google.
export function inOrder<T>(key: string, work: () => Promise<T>): Promise<T> {
  const run = (queues.get(key) ?? Promise.resolve()).then(work, work);
  const settled = run.catch(() => {});
  queues.set(key, settled);
  void settled.finally(() => queues.get(key) === settled && queues.delete(key));
  return run;
}

// Resolves once no calendar work is left running (tests wait for it between steps).
export async function idle() {
  while (pending.size || queues.size) await Promise.allSettled([...pending, ...queues.values()]);
}
