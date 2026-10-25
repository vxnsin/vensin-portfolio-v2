import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "fs";
import { readFile } from "fs/promises";
import { createGzip } from "zlib";
import { pipeline } from "stream/promises";
import path from "path";
import { DATA_DIR, getDb } from "./db";

// Nightly safety net for the sqlite file: a consistent online copy, gzipped, kept locally with rotation, and (optionally)
// sent off-site as a file attached to a private Discord channel. The database holds contact emails and the spotify
// token, so this only ever leaves the Pi as a Discord attachment in a channel you control, never to a public host.

const API = "https://discord.com/api/v10";
export const BACKUP_DIR = path.join(DATA_DIR, "backups");
const KEEP = Math.max(1, Number(process.env.BACKUP_KEEP ?? 14));

export const backupToDiscordConfigured = () => Boolean(process.env.DISCORD_BACKUP_WEBHOOK_URL || (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BACKUP_CHANNEL_ID));
export const backupUploadMode = (): "discord" | "local" => (backupToDiscordConfigured() ? "discord" : "local");

export type BackupFile = { name: string; size: number; at: string };
export type BackupResult = { file: string; size: number; uploaded: boolean; via: "discord" | "none"; removed: string[] };

const stamp = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;

export function listBackups(): BackupFile[] {
  if (!existsSync(BACKUP_DIR)) return [];
  return readdirSync(BACKUP_DIR)
    .filter((n) => n.endsWith(".sqlite.gz"))
    .map((name) => {
      const st = statSync(path.join(BACKUP_DIR, name));
      return { name, size: st.size, at: st.mtime.toISOString() };
    })
    .sort((a, b) => (a.name < b.name ? 1 : -1));
}

/* ---------- the job ---------- */

/** copies the live database (sqlite online backup, safe while the site runs), gzips it, rotates old files and sends it off-site */
export async function runBackup(): Promise<BackupResult> {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const base = path.join(BACKUP_DIR, `vensin-${stamp()}.sqlite`);
  await getDb().backup(base);
  const gz = `${base}.gz`;
  await pipeline(createReadStream(base), createGzip({ level: 9 }), createWriteStream(gz));
  await unlinkSync(base);
  const size = statSync(gz).size;

  const removed: string[] = [];
  for (const old of listBackups().slice(KEEP)) {
    unlinkSync(path.join(BACKUP_DIR, old.name));
    removed.push(old.name);
  }

  if (backupUploadMode() === "local") return { file: path.basename(gz), size, uploaded: false, via: "none", removed };

  const ok = await postToDiscord(`🗄️ nightly backup · \`${path.basename(gz)}\` · ${(size / 1024).toFixed(1)} kb\n-# gunzip it and drop it in as vensin.sqlite to restore`, gz);
  if (!ok) throw new Error("backup saved locally, but the discord upload failed");
  return { file: path.basename(gz), size, uploaded: true, via: "discord", removed };
}

/* ---------- transport ---------- */

/** a message in the backup channel, optionally with a file attached */
async function postToDiscord(content: string, file?: string): Promise<boolean> {
  const body = new FormData();
  body.append("payload_json", JSON.stringify({ content }));
  if (file) body.append("files[0]", new Blob([new Uint8Array(await readFile(file))], { type: "application/octet-stream" }), path.basename(file));
  try {
    const webhook = process.env.DISCORD_BACKUP_WEBHOOK_URL;
    if (webhook) {
      const res = await fetch(webhook, { method: "POST", body });
      return res.ok;
    }
    const token = process.env.DISCORD_BOT_TOKEN;
    const channel = process.env.DISCORD_BACKUP_CHANNEL_ID;
    if (token && channel) {
      const res = await fetch(`${API}/channels/${channel}/messages`, { method: "POST", headers: { authorization: `Bot ${token}` }, body });
      return res.ok;
    }
  } catch {}
  return false;
}
