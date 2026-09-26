import { jobs, type Job } from "./jobs";
import { getJobRun, setJobRun } from "./store";

// In-process scheduler. Started once from instrumentation.ts when the node server boots.
// Interval jobs run on their interval, daily jobs when the local clock passes their time.
// Everything also runs once shortly after startup if it has never run (or is overdue).

declare global {
  var __vensinScheduler: boolean | undefined;
}

const TICK_MS = 30_000;

export async function runJob(job: Job): Promise<void> {
  const started = Date.now();
  try {
    await job.run();
    setJobRun(job.id, { at: new Date().toISOString(), ok: true, ms: Date.now() - started });
  } catch (e) {
    setJobRun(job.id, { at: new Date().toISOString(), ok: false, ms: Date.now() - started, error: e instanceof Error ? e.message : String(e) });
  }
}

function due(job: Job, now: Date): boolean {
  const last = getJobRun(job.id);
  const lastAt = last ? new Date(last.at).getTime() : 0;
  if (job.since && lastAt < job.since()) return true;
  if (job.every) return now.getTime() - lastAt >= job.every;
  if (job.daily) {
    const [h, m] = job.daily.split(":").map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target > now) target.setDate(target.getDate() - 1); // most recent occurrence
    return lastAt < target.getTime();
  }
  return false;
}

export function startScheduler() {
  if (globalThis.__vensinScheduler) return;
  globalThis.__vensinScheduler = true;

  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const now = new Date();
      for (const job of jobs) if (due(job, now)) await runJob(job);
    } finally {
      busy = false;
    }
  };

  setTimeout(tick, 5_000); // first pass shortly after boot
  setInterval(tick, TICK_MS);
}

export { jobs };
