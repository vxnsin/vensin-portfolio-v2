import { createHash } from "crypto";
import { getDb, kvGet, kvSet } from "./db";
import { limited } from "./ratelimit";

// Old-web visitor counter without cookies: one visit per person per day, recognised by a hash of ip + user agent + the day.
// The hash is salted with the day, so nothing links two days together, and rows older than two days are thrown away.
// The lifetime total is a single number in kv.

const salt = () => process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? "vensin";
const today = () => new Date().toISOString().slice(0, 10);

export const visitorHash = (ip: string, userAgent: string, day = today()) => createHash("sha256").update(`${salt()}|${day}|${ip}|${userAgent}`).digest("hex").slice(0, 32);

/** counts a page view if this visitor was not seen today; returns true when it was a new visitor */
export function recordVisit(ip: string, userAgent: string): boolean {
  const db = getDb();
  const day = today();
  const r = db.prepare("insert or ignore into visits (day, hash) values (?, ?)").run(day, visitorHash(ip, userAgent, day));
  if (r.changes === 0) return false;
  if (limited(`visit-ip:${ip}:${day}`, 3, 36 * 3600_000)) return false; // three browsers per ip and day is people, more is a script
  kvSet("visits:total", kvGet<number>("visits:total", 0) + 1);
  // keep only today and yesterday; the day boundary is utc, so yesterday still matters for a while
  db.prepare("delete from visits where day < date('now', '-1 day')").run();
  return true;
}

export function visitorStats(): { total: number; today: number } {
  const t = (getDb().prepare("select count(*) n from visits where day = ?").get(today()) as { n: number }).n;
  return { total: kvGet<number>("visits:total", 0), today: t };
}
