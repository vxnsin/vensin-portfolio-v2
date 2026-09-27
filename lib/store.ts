import { site } from "@/data/site";
import { DB_FILE, getDb, kvGet, kvSet, uid } from "./db";

export { uid, DATA_DIR } from "./db";

/* ---------- types ---------- */

export type Message = { id: string; name: string; email: string; message: string; createdAt: string; read: boolean };
export type GalleryItem = { id: string; url: string; kind: "image" | "video"; caption: string; tag: string; createdAt: string; pathname?: string };
export type UpdateEntry = { id: string; date: string; text: string };
export type Settings = { updateLog: UpdateEntry[]; marquee: string[] };
export type Favorite = { id: string; kitsuId: string; slug: string; title: string; poster: string | null; note: string; rating: number; createdAt: string };
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
export type Latest = { items?: Record<string, LatestItem>; checkedAt?: string };

export const storage = { kind: "sqlite" as const, file: DB_FILE, persistent: !process.env.VERCEL };

/* ---------- settings: update log + marquee ---------- */

type UpdateRow = { id: string; date: string; text: string };

export async function getSettings(): Promise<Settings> {
  const rows = getDb().prepare("select id, date, text from updates order by date desc, created_at desc limit 100").all() as UpdateRow[];
  const updateLog = rows.length ? rows : site.updateLog.map((u, i) => ({ id: `seed-${i}`, ...u }));
  return { updateLog, marquee: kvGet<string[]>("marquee", site.marquee) };
}
export const getSettingsFresh = getSettings;

export async function saveMarquee(lines: string[]) {
  kvSet("marquee", lines);
}

export async function addUpdate(date: string, text: string) {
  getDb().prepare("insert into updates (id, date, text, created_at) values (?, ?, ?, ?)").run(uid(), date, text, new Date().toISOString());
}
export async function deleteUpdate(id: string) {
  getDb().prepare("delete from updates where id = ?").run(id);
}

/* ---------- contact messages ---------- */

type MessageRow = { id: string; name: string; email: string; message: string; created_at: string; read: number };
const toMessage = (r: MessageRow): Message => ({ id: r.id, name: r.name, email: r.email, message: r.message, createdAt: r.created_at, read: r.read === 1 });

export async function listMessages(): Promise<Message[]> {
  return (getDb().prepare("select * from messages order by created_at desc limit 500").all() as MessageRow[]).map(toMessage);
}
export async function addMessage(m: Omit<Message, "id" | "createdAt" | "read">, ipHash = ""): Promise<Message> {
  const msg: Message = { id: uid(), createdAt: new Date().toISOString(), read: false, ...m };
  getDb().prepare("insert into messages (id, name, email, message, created_at, read, ip_hash) values (?, ?, ?, ?, ?, 0, ?)").run(msg.id, msg.name, msg.email, msg.message, msg.createdAt, ipHash);
  return msg;
}
/** how many messages this sender left in the last `ms` milliseconds (survives restarts, unlike an in-memory counter) */
export function messagesFromSender(ipHash: string, ms: number): number {
  const since = new Date(Date.now() - ms).toISOString();
  const r = getDb().prepare("select count(*) n from messages where ip_hash = ? and created_at >= ?").get(ipHash, since) as { n: number };
  return r.n;
}
export async function updateMessage(id: string, patch: Partial<Message>) {
  if (typeof patch.read === "boolean") getDb().prepare("update messages set read = ? where id = ?").run(patch.read ? 1 : 0, id);
}
export async function deleteMessage(id: string) {
  getDb().prepare("delete from messages where id = ?").run(id);
}

/* ---------- gallery ---------- */

type GalleryRow = { id: string; url: string; kind: "image" | "video"; caption: string; tag: string; pathname: string | null; created_at: string };
const toGallery = (r: GalleryRow): GalleryItem => ({ id: r.id, url: r.url, kind: r.kind, caption: r.caption, tag: r.tag, pathname: r.pathname ?? undefined, createdAt: r.created_at });

export async function listGallery(): Promise<GalleryItem[]> {
  return (getDb().prepare("select * from gallery order by created_at desc").all() as GalleryRow[]).map(toGallery);
}
export const listGalleryFresh = listGallery;
export async function addGalleryItem(item: Omit<GalleryItem, "id" | "createdAt">): Promise<GalleryItem> {
  const it: GalleryItem = { id: uid(), createdAt: new Date().toISOString(), ...item };
  getDb().prepare("insert into gallery (id, url, kind, caption, tag, pathname, created_at) values (?, ?, ?, ?, ?, ?, ?)").run(it.id, it.url, it.kind, it.caption, it.tag, it.pathname ?? null, it.createdAt);
  return it;
}
export async function removeGalleryItem(id: string): Promise<GalleryItem | undefined> {
  const row = getDb().prepare("select * from gallery where id = ?").get(id) as GalleryRow | undefined;
  getDb().prepare("delete from gallery where id = ?").run(id);
  return row ? toGallery(row) : undefined;
}

/* ---------- favorite anime ---------- */

type FavRow = { id: string; kitsu_id: string; slug: string; title: string; poster: string | null; note: string; rating: number; created_at: string };
const toFav = (r: FavRow): Favorite => ({ id: r.id, kitsuId: r.kitsu_id, slug: r.slug, title: r.title, poster: r.poster, note: r.note, rating: r.rating, createdAt: r.created_at });

export async function listFavorites(): Promise<Favorite[]> {
  return (getDb().prepare("select * from favorites order by position asc").all() as FavRow[]).map(toFav);
}
export const listFavoritesFresh = listFavorites;
export async function addFavorite(f: Omit<Favorite, "id" | "createdAt">): Promise<Favorite | null> {
  const db = getDb();
  if (db.prepare("select 1 from favorites where kitsu_id = ?").get(f.kitsuId)) return null;
  const pos = ((db.prepare("select max(position) m from favorites").get() as { m: number | null }).m ?? -1) + 1;
  const fav: Favorite = { id: uid(), createdAt: new Date().toISOString(), ...f };
  db.prepare("insert into favorites (id, kitsu_id, slug, title, poster, note, rating, position, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    fav.id,
    fav.kitsuId,
    fav.slug,
    fav.title,
    fav.poster,
    fav.note,
    fav.rating,
    pos,
    fav.createdAt,
  );
  return fav;
}
export async function updateFavorite(id: string, patch: Partial<Pick<Favorite, "note" | "rating">>) {
  getDb().prepare("update favorites set note = coalesce(?, note), rating = coalesce(?, rating) where id = ?").run(patch.note ?? null, patch.rating ?? null, id);
}
export async function removeFavorite(id: string) {
  getDb().prepare("delete from favorites where id = ?").run(id);
}
export async function moveFavorite(id: string, dir: -1 | 1) {
  const db = getDb();
  const rows = db.prepare("select id, position from favorites order by position asc").all() as Array<{ id: string; position: number }>;
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  const swap = db.transaction(() => {
    db.prepare("update favorites set position = ? where id = ?").run(rows[j].position, rows[i].id);
    db.prepare("update favorites set position = ? where id = ?").run(rows[i].position, rows[j].id);
  });
  swap();
}

/* ---------- neighbors (88x31 buttons) ---------- */

export type Neighbor = { id: string; name: string; url: string; buttonUrl: string; createdAt: string };
type NeighborRow = { id: string; name: string; url: string; button_url: string; created_at: string };
const toNeighbor = (r: NeighborRow): Neighbor => ({ id: r.id, name: r.name, url: r.url, buttonUrl: r.button_url, createdAt: r.created_at });

export async function listNeighbors(): Promise<Neighbor[]> {
  return (getDb().prepare("select * from neighbors order by position asc").all() as NeighborRow[]).map(toNeighbor);
}
export async function addNeighbor(n: Omit<Neighbor, "id" | "createdAt">): Promise<Neighbor> {
  const db = getDb();
  const pos = ((db.prepare("select max(position) m from neighbors").get() as { m: number | null }).m ?? -1) + 1;
  const it: Neighbor = { id: uid(), createdAt: new Date().toISOString(), ...n };
  db.prepare("insert into neighbors (id, name, url, button_url, position, created_at) values (?, ?, ?, ?, ?, ?)").run(it.id, it.name, it.url, it.buttonUrl, pos, it.createdAt);
  return it;
}
export async function removeNeighbor(id: string) {
  getDb().prepare("delete from neighbors where id = ?").run(id);
}
export async function moveNeighbor(id: string, dir: -1 | 1) {
  const db = getDb();
  const rows = db.prepare("select id, position from neighbors order by position asc").all() as Array<{ id: string; position: number }>;
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  db.transaction(() => {
    db.prepare("update neighbors set position = ? where id = ?").run(rows[j].position, rows[i].id);
    db.prepare("update neighbors set position = ? where id = ?").run(rows[i].position, rows[j].id);
  })();
}

/* ---------- apple watch rings ---------- */

export async function getHealth(): Promise<Health | null> {
  return kvGet<Health | null>("health", null);
}
export async function saveHealth(h: Health) {
  kvSet("health", h);
}

/* ---------- latest discord activity ---------- */

export async function getLatest(): Promise<Latest> {
  return kvGet<Latest>("latest", {});
}
export const getLatestFresh = getLatest;
export async function saveLatest(l: Latest) {
  kvSet("latest", l);
}

/* ---------- activities we already told the owner about ---------- */

export async function listSeenActivities(): Promise<string[]> {
  return (getDb().prepare("select key from seen_activities").all() as Array<{ key: string }>).map((r) => r.key);
}
export async function markActivitySeen(key: string) {
  getDb().prepare("insert or ignore into seen_activities (key, first_seen) values (?, ?)").run(key, new Date().toISOString());
}

/* ---------- scheduler bookkeeping ---------- */

export type JobRun = { at: string; ok: boolean; ms: number; error?: string };
export const getJobRun = (id: string) => kvGet<JobRun | null>(`job:${id}`, null);
export const setJobRun = (id: string, run: JobRun) => kvSet(`job:${id}`, run);
