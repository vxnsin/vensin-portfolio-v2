import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";

// One SQLite file holds everything: content, settings, health data, and a cache for external APIs.
export const DATA_DIR = process.env.DATA_DIR ?? (process.env.VERCEL ? "/tmp/vensin-data" : path.join(/* turbopackIgnore: true */ process.cwd(), ".data"));
export const DB_FILE = path.join(DATA_DIR, "vensin.sqlite");

const SCHEMA = `
  create table if not exists kv (key text primary key, value text not null, updated_at text not null);
  create table if not exists cache (key text primary key, value text not null, fetched_at integer not null, expires_at integer not null);
  create table if not exists messages (id text primary key, name text not null, email text not null, message text not null, created_at text not null, read integer not null default 0);
  create table if not exists gallery (id text primary key, url text not null, kind text not null, caption text not null default '', tag text not null default 'misc', pathname text, created_at text not null);
  create table if not exists gallery_folders (id text primary key, parent_id text, slug text not null, name text not null, icon text not null default 'folder', exclusive integer not null default 0, unlisted integer not null default 0, position integer not null default 0, created_at text not null);
  create table if not exists updates (id text primary key, date text not null, text text not null, created_at text not null);
  create table if not exists favorites (id text primary key, kitsu_id text not null unique, slug text not null default '', title text not null, poster text, note text not null default '', rating integer not null default 8, position integer not null, created_at text not null);
  create table if not exists seen_activities (key text primary key, first_seen text not null);
  create table if not exists neighbors (id text primary key, name text not null, url text not null, button_url text not null, position integer not null, created_at text not null);
  create table if not exists listens (id integer primary key autoincrement, track_id text, song text not null, artist text not null, album text, art text, at text not null);
  create table if not exists guestbook (id text primary key, name text not null, message text not null, website text, created_at text not null, status text not null default 'approved', reasons text not null default '[]', ip_hash text not null default '');
  create index if not exists guestbook_status on guestbook (status, created_at desc);
  create table if not exists visits (day text not null, hash text not null, primary key (day, hash));
  create table if not exists anime_log (title text not null, season integer, episode integer, url text not null default '', cover text, seen_at text not null, finished integer not null default 0, primary key (title, season, episode));
  create table if not exists setup_items (id text primary key, category text not null, name text not null, note text not null default '', url text, image text, position integer not null default 0, created_at text not null);
  create table if not exists projects (id text primary key, slug text not null unique, name text not null, tagline text not null default '', description text not null default '', tech text not null default '[]', thumbnail text not null default '', start integer not null, end integer, status text not null default 'active', role text not null default '', highlights text not null default '[]', links text not null default '[]', position integer not null default 0, created_at text not null);
  create index if not exists guestbook_ip on guestbook (ip_hash, created_at);
  create index if not exists listens_at on listens (at);
  create index if not exists listens_track on listens (track_id);
  create index if not exists messages_created on messages (created_at desc);
  create index if not exists gallery_created on gallery (created_at desc);
  create index if not exists favorites_position on favorites (position);
`;

declare global {
  var __vensinDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (globalThis.__vensinDb) return globalThis.__vensinDb;
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(SCHEMA);
  migrate(db);
  migrateFromJson(db);
  globalThis.__vensinDb = db;
  return db;
}

/* ---------- schema upgrades for existing files ---------- */

function migrate(db: Database.Database) {
  const cols = (db.prepare("pragma table_info(listens)").all() as Array<{ name: string }>).map((c) => c.name);
  if (!cols.includes("minutes")) db.exec("alter table listens add column minutes real not null default 1");
  if (!cols.includes("played_at")) db.exec("alter table listens add column played_at text");
  if (!cols.includes("source")) db.exec("alter table listens add column source text not null default 'poll'");
  db.exec("create unique index if not exists listens_played_at on listens (played_at) where played_at is not null");
  const logCols = (db.prepare("pragma table_info(anime_log)").all() as Array<{ name: string }>).map((c) => c.name);
  if (!logCols.includes("imported")) db.exec("alter table anime_log add column imported integer not null default 0");
  const msgCols = (db.prepare("pragma table_info(messages)").all() as Array<{ name: string }>).map((c) => c.name);
  if (!msgCols.includes("ip_hash")) db.exec("alter table messages add column ip_hash text not null default ''");
  // gallery: items live in folders now; the old free-text tags become top-level folders once
  const galCols = (db.prepare("pragma table_info(gallery)").all() as Array<{ name: string }>).map((c) => c.name);
  if (!galCols.includes("folder_id")) {
    db.exec("alter table gallery add column folder_id text");
    const tags = (db.prepare("select distinct tag from gallery where tag != ''").all() as Array<{ tag: string }>).map((r) => r.tag);
    tags.forEach((tag, i) => {
      const id = uid();
      const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "misc";
      db.prepare("insert into gallery_folders (id, parent_id, slug, name, position, created_at) values (?, null, ?, ?, ?, ?)").run(id, slug, tag, i, new Date().toISOString());
      db.prepare("update gallery set folder_id = ? where tag = ?").run(id, tag);
    });
  }
  if (!galCols.includes("taken_at")) db.exec("alter table gallery add column taken_at text");
  if (!galCols.includes("title")) db.exec("alter table gallery add column title text not null default ''");
  // videos: a still for tiles and covers, and a light web copy (h.264, 1080p) made in the background by ffmpeg
  if (!galCols.includes("poster")) db.exec("alter table gallery add column poster text");
  if (!galCols.includes("web_url")) db.exec("alter table gallery add column web_url text");
  if (!galCols.includes("web_status")) db.exec("alter table gallery add column web_status text");
  // videos: 0 = metadata still to be removed by ffmpeg, 1 = removed, -1 = could not be (location was still blanked on upload)
  if (!galCols.includes("meta_clean")) db.exec("alter table gallery add column meta_clean integer not null default 0");
  const folderCols = (db.prepare("pragma table_info(gallery_folders)").all() as Array<{ name: string }>).map((c) => c.name);
  if (!folderCols.includes("cover_id")) db.exec("alter table gallery_folders add column cover_id text");
  db.exec("create index if not exists gallery_folder on gallery (folder_id)");
  db.exec("create unique index if not exists gallery_folders_slug on gallery_folders (coalesce(parent_id, ''), slug)");
}

/* ---------- tiny kv helpers ---------- */

export function kvGet<T>(key: string, fallback: T): T {
  const row = getDb().prepare("select value from kv where key = ?").get(key) as { value: string } | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function kvSet(key: string, value: unknown) {
  getDb()
    .prepare("insert into kv (key, value, updated_at) values (?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
    .run(key, JSON.stringify(value), new Date().toISOString());
}

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/* ---------- one-time import of the old json store ---------- */

function migrateFromJson(db: Database.Database) {
  const file = path.join(DATA_DIR, "store.json");
  if (!existsSync(file)) return;
  const done = db.prepare("select 1 from kv where key = 'migrated_json'").get();
  if (done) return;
  try {
    const j = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    const now = new Date().toISOString();
    const tx = db.transaction(() => {
      for (const m of (j.messages as Array<Record<string, unknown>>) ?? []) {
        db.prepare("insert or ignore into messages (id, name, email, message, created_at, read) values (?, ?, ?, ?, ?, ?)").run(
          m.id,
          m.name,
          m.email,
          m.message,
          m.createdAt ?? now,
          m.read ? 1 : 0,
        );
      }
      for (const g of (j.gallery as Array<Record<string, unknown>>) ?? []) {
        db.prepare("insert or ignore into gallery (id, url, kind, caption, tag, pathname, created_at) values (?, ?, ?, ?, ?, ?, ?)").run(
          g.id,
          g.url,
          g.kind ?? "image",
          g.caption ?? "",
          g.tag ?? "misc",
          g.pathname ?? null,
          g.createdAt ?? now,
        );
      }
      let pos = 0;
      for (const f of (j.favorites as Array<Record<string, unknown>>) ?? []) {
        db.prepare(
          "insert or ignore into favorites (id, kitsu_id, slug, title, poster, note, rating, position, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).run(f.id, f.kitsuId, f.slug ?? "", f.title, f.poster ?? null, f.note ?? "", f.rating ?? 8, pos++, f.createdAt ?? now);
      }
      const settings = (j.settings as { updateLog?: Array<Record<string, unknown>>; marquee?: string[] }) ?? {};
      for (const u of settings.updateLog ?? []) {
        db.prepare("insert or ignore into updates (id, date, text, created_at) values (?, ?, ?, ?)").run(u.id, u.date, u.text, now);
      }
      if (settings.marquee) kvSetWith(db, "marquee", settings.marquee);
      if (j.health) kvSetWith(db, "health", j.health);
      if (j.latest) kvSetWith(db, "latest", j.latest);
      kvSetWith(db, "migrated_json", true);
    });
    tx();
  } catch {
    // a broken json file is not worth crashing over
  }
}

function kvSetWith(db: Database.Database, key: string, value: unknown) {
  db.prepare("insert into kv (key, value, updated_at) values (?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at").run(
    key,
    JSON.stringify(value),
    new Date().toISOString(),
  );
}
