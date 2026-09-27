// A small in-memory rate limiter for the public endpoints: fixed windows per key, memory bounded, no dependencies.
// Good enough for one node process on a pi behind cloudflare; the counters reset on restart, which is fine.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 20_000;

/** true when `key` has exceeded `limit` hits inside the current `windowMs` window; counts the hit otherwise */
export function limited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) sweep(now);
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  return b.count > limit;
}

/** how many hits `key` still has in its window (for headers or messages) */
export function remaining(key: string, limit: number): number {
  const b = buckets.get(key);
  return b && b.resetAt > Date.now() ? Math.max(0, limit - b.count) : limit;
}

function sweep(now: number) {
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  if (buckets.size >= MAX_KEYS) buckets.clear(); // flooded with fresh keys: start over rather than grow
}

/** the client ip as the proxy sees it (cloudflare / tunnel set x-forwarded-for) */
export const clientIp = (headers: Headers) => (headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();

/** a 429 with a retry hint */
export const tooManyResponse = (retryAfterSec = 30) =>
  new Response(JSON.stringify({ error: "too many requests, slow down a little" }), { status: 429, headers: { "content-type": "application/json", "retry-after": String(retryAfterSec), "cache-control": "no-store" } });
