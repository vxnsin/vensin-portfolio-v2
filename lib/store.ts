import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { site } from "@/data/site";

/* ---------- types ---------- */

export type Message = { id: string; name: string; email: string; message: string; createdAt: string; read: boolean };
export type GalleryItem = { id: string; url: string; caption: string; tag: string; createdAt: string; pathname?: string };
export type UpdateEntry = { id: string; date: string; text: string };
export type NowBox = { watching: string; playing: string; listening: string; mood: string };
export type Settings = { updateLog: UpdateEntry[]; marquee: string[]; now: NowBox };

const DEFAULT_SETTINGS: Settings = {
  updateLog: site.updateLog.map((u, i) => ({ id: `seed-${i}`, ...u })),
  marquee: site.marquee,
  now: site.now,
};

/* ---------- backend: Upstash Redis, or a JSON file when not configured ---------- */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

// local fallback (dev). On Vercel without Redis this lands in /tmp and is ephemeral.
const FILE = process.env.VERCEL ? "/tmp/vensin-store.json" : path.join(process.cwd(), ".data", "store.json");

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

/* ---------- settings (update log, marquee, now box) ---------- */

const settingsCached = unstable_cache(() => get<Settings>("settings", DEFAULT_SETTINGS), ["settings"], { tags: ["settings"], revalidate: 300 });

export async function getSettings(): Promise<Settings> {
  const s = await settingsCached();
  return { ...DEFAULT_SETTINGS, ...s, now: { ...DEFAULT_SETTINGS.now, ...s.now } };
}
export async function getSettingsFresh(): Promise<Settings> {
  const s = await get<Settings>("settings", DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...s, now: { ...DEFAULT_SETTINGS.now, ...s.now } };
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
