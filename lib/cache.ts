import { getDb } from "./db";

// External data (github, kitsu, weather, …) lives in the `cache` table with a ttl.
// Reads never block on the network while a fresh value exists; on a miss the fetcher runs once
// and the value is stored. If the fetcher fails, a stale value is returned instead of nothing.

const inflight = new Map<string, Promise<unknown>>();

type Row = { value: string; fetched_at: number; expires_at: number };

export function peek<T>(key: string): { value: T; fetchedAt: number; fresh: boolean } | null {
  const row = getDb().prepare("select value, fetched_at, expires_at from cache where key = ?").get(key) as Row | undefined;
  if (!row) return null;
  try {
    return { value: JSON.parse(row.value) as T, fetchedAt: row.fetched_at, fresh: row.expires_at > Date.now() };
  } catch {
    return null;
  }
}

export function put(key: string, value: unknown, ttlMs: number) {
  const now = Date.now();
  getDb()
    .prepare(
      "insert into cache (key, value, fetched_at, expires_at) values (?, ?, ?, ?) on conflict(key) do update set value = excluded.value, fetched_at = excluded.fetched_at, expires_at = excluded.expires_at",
    )
    .run(key, JSON.stringify(value ?? null), now, now + ttlMs);
}

/** Force a refresh (used by the scheduler). Keeps the old value when the fetcher fails or returns null. */
export async function refresh<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T | null> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = (async () => {
    try {
      const value = await fetcher();
      if (value !== null && value !== undefined) put(key, value, ttlMs);
      else {
        const old = peek<T>(key);
        if (old) put(key, old.value, ttlMs); // extend the old value so we don't hammer a failing api
        return old?.value ?? null;
      }
      return value;
    } catch {
      return peek<T>(key)?.value ?? null;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/** Fresh value from the cache, otherwise fetch (and fall back to a stale copy on failure). */
export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T | null> {
  const hit = peek<T>(key);
  if (hit?.fresh) return hit.value;
  return refresh(key, ttlMs, fetcher);
}

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
