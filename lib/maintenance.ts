import { kvGet, kvSet } from "./db";

export type Maintenance = { on: boolean; message: string; since: string | null };

const DEFAULT: Maintenance = { on: false, message: "vensin.dev is being worked on. back soon!", since: null };

// small in-memory cache so the proxy does not hit sqlite on every single request
let cache: { value: Maintenance; at: number } | null = null;
const CACHE_MS = 3_000;

export function getMaintenance(): Maintenance {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const value = { ...DEFAULT, ...kvGet<Partial<Maintenance>>("maintenance", {}) };
  cache = { value, at: Date.now() };
  return value;
}

export function setMaintenance(on: boolean, message: string) {
  const current = getMaintenance();
  const next: Maintenance = { on, message: message || DEFAULT.message, since: on ? (current.on ? current.since : new Date().toISOString()) : null };
  kvSet("maintenance", next);
  cache = null;
  return next;
}
