import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { site } from "@/data/site";

/* ---------- types ---------- */

export type Message = { id: string; name: string; email: string; message: string; createdAt: string; read: boolean };
export type GalleryItem = {
  id: string;
  url: string;
  kind: "image" | "video";
  caption: string;
  tag: string;
  createdAt: string;
  pathname?: string;
};
export type UpdateEntry = { id: string; date: string; text: string };
export type Settings = { updateLog: UpdateEntry[]; marquee: string[] };

export type Health = {
  move: number;
  moveGoal: number;
  exercise: number;
  exerciseGoal: number;
  stand: number;
  standGoal: number;
  steps?: number;
  date?: string;
  updatedAt: string;
};

export type LatestItem = { value: string; href?: string | null; at: string };
export type Latest = {
  /** keyed by activity kind: listening, coding, watching, playing */
  items?: Record<string, LatestItem>;
  checkedAt?: string;
};

const DEFAULT_SETTINGS: Settings = {
  updateLog: site.updateLog.map((u, i) => ({ id: `seed-${i}`, ...u })),
  marquee: site.marquee,
};

/* ---------- backend: Upstash Redis, or a JSON file when not configured ---------- */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

// file fallback: DATA_DIR (default ./.data). On Vercel without Redis this is /tmp and not persistent.
export const DATA_DIR = process.env.DATA_DIR ?? (process.env.VERCEL ? "/tmp/vensin-data" : path.join(process.cwd(), ".data"));
const FILE = path.join(DATA_DIR, "store.json");

export const storage = {
  kind: redis ? ("redis" as const) : ("file" as const),
  persistent: Boolean(redis) || !process.env.VERCEL,
};

async function readFile(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}
async function writeFile(data: Record<string, unknown>) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

async function get<T>(key: string, fallback: T): Promise<T> {
  if (redis) return ((await redis.get<T>(key)) ?? fallback) as T;
  const all = await readFile();
  return (all[key] as T) ?? fallback;
}
async function set<T>(key: string, value: T) {
  if (redis) {
    await redis.set(key, value);
    return;
  }
  const all = await readFile();
  all[key] = value;
  await writeFile(all);
}

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/* ---------- settings (update log, marquee) ---------- */

const settingsCached = unstable_cache(() => get<Settings>("settings", DEFAULT_SETTINGS), ["settings"], { tags: ["settings"], revalidate: 300 });

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await settingsCached()) };
}
export async function getSettingsFresh(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await get<Settings>("settings", DEFAULT_SETTINGS)) };
}
export async function saveSettings(patch: Partial<Settings>) {
  const current = await getSettingsFresh();
  await set("settings", { ...current, ...patch });
  revalidateTag("settings", "max");
  revalidatePath("/", "layout");
}

/* ---------- contact messages ---------- */

export const listMessages = () => get<Message[]>("messages", []);
export async function addMessage(m: Omit<Message, "id" | "createdAt" | "read">) {
  const msgs = await listMessages();
  const msg: Message = { id: uid(), createdAt: new Date().toISOString(), read: false, ...m };
  await set("messages", [msg, ...msgs].slice(0, 500));
  return msg;
}
export async function updateMessage(id: string, patch: Partial<Message>) {
  const msgs = await listMessages();
  await set(
    "messages",
    msgs.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  );
}
export async function deleteMessage(id: string) {
  const msgs = await listMessages();
  await set(
    "messages",
    msgs.filter((m) => m.id !== id),
  );
}

/* ---------- gallery ---------- */

const galleryCached = unstable_cache(() => get<GalleryItem[]>("gallery", []), ["gallery"], { tags: ["gallery"], revalidate: 300 });
export const listGallery = () => galleryCached();
export const listGalleryFresh = () => get<GalleryItem[]>("gallery", []);
export async function addGalleryItem(item: Omit<GalleryItem, "id" | "createdAt">) {
  const items = await listGalleryFresh();
  const it: GalleryItem = { id: uid(), createdAt: new Date().toISOString(), ...item };
  await set("gallery", [it, ...items]);
  revalidateTag("gallery", "max");
  revalidatePath("/gallery");
  return it;
}
export async function removeGalleryItem(id: string) {
  const items = await listGalleryFresh();
  const item = items.find((i) => i.id === id);
  await set(
    "gallery",
    items.filter((i) => i.id !== id),
  );
  revalidateTag("gallery", "max");
  revalidatePath("/gallery");
  return item;
}

/* ---------- favorite anime (managed in /admin/anime) ---------- */

export type Favorite = {
  id: string;
  kitsuId: string;
  slug: string;
  title: string;
  poster: string | null;
  note: string;
  rating: number; // own rating 1-10
  createdAt: string;
};

const favoritesCached = unstable_cache(() => get<Favorite[]>("favorites", []), ["favorites"], { tags: ["favorites"], revalidate: 3600 });
export const listFavorites = () => favoritesCached();
export const listFavoritesFresh = () => get<Favorite[]>("favorites", []);
export async function addFavorite(f: Omit<Favorite, "id" | "createdAt">) {
  const items = await listFavoritesFresh();
  if (items.some((i) => i.kitsuId === f.kitsuId)) return null;
  const fav: Favorite = { id: uid(), createdAt: new Date().toISOString(), ...f };
  await set("favorites", [...items, fav]);
  revalidateTag("favorites", "max");
  revalidatePath("/anime");
  return fav;
}
export async function updateFavorite(id: string, patch: Partial<Pick<Favorite, "note" | "rating">>) {
  const items = await listFavoritesFresh();
  await set(
    "favorites",
    items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  );
  revalidateTag("favorites", "max");
  revalidatePath("/anime");
}
export async function removeFavorite(id: string) {
  const items = await listFavoritesFresh();
  await set(
    "favorites",
    items.filter((i) => i.id !== id),
  );
  revalidateTag("favorites", "max");
  revalidatePath("/anime");
}
export async function moveFavorite(id: string, dir: -1 | 1) {
  const items = await listFavoritesFresh();
  const i = items.findIndex((f) => f.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  await set("favorites", items);
  revalidateTag("favorites", "max");
  revalidatePath("/anime");
}

/* ---------- apple watch rings ---------- */

const healthCached = unstable_cache(() => get<Health | null>("health", null), ["health"], { tags: ["health"], revalidate: 300 });
export const getHealth = () => healthCached();
export async function saveHealth(h: Health) {
  await set("health", h);
  revalidateTag("health", "max");
  revalidatePath("/", "layout");
}

/* ---------- latest discord activity ---------- */

const latestCached = unstable_cache(() => get<Latest>("latest", {}), ["latest"], { tags: ["latest"], revalidate: 60 });
export const getLatest = () => latestCached();
export const getLatestFresh = () => get<Latest>("latest", {});
export async function saveLatest(l: Latest) {
  await set("latest", l);
  revalidateTag("latest", "max");
}

/* ---------- activities we already told the owner about ---------- */

export const listSeenActivities = () => get<string[]>("seenActivities", []);
export async function markActivitySeen(key: string) {
  const seen = await listSeenActivities();
  if (!seen.includes(key)) await set("seenActivities", [...seen, key].slice(-200));
}
