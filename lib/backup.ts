import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "fs";
import { readFile, unlink, writeFile } from "fs/promises";
import { createGzip } from "zlib";
import { pipeline } from "stream/promises";
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "crypto";
import path from "path";
import { DATA_DIR, getDb } from "./db";

// Nightly safety net for the sqlite file: a consistent online copy, gzipped, kept locally with rotation, and sent off-site.
// Off-site means either the file itself into a private Discord channel, or (preferred) an encrypted copy to catbox.moe with
// the link posted to that channel. The database holds contact emails and the spotify token, so a public host only ever
// gets the encrypted file; without BACKUP_PASSPHRASE the catbox route is refused.

const API = "https://discord.com/api/v10";
const CATBOX = "https://catbox.moe/user/api.php";
export const BACKUP_DIR = path.join(DATA_DIR, "backups");
const KEEP = Math.max(1, Number(process.env.BACKUP_KEEP ?? 14));

export const backupToDiscordConfigured = () => Boolean(process.env.DISCORD_BACKUP_WEBHOOK_URL || (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BACKUP_CHANNEL_ID));
export const backupUploadMode = (): "catbox" | "discord" | "local" => {
  if (!backupToDiscordConfigured()) return "local";
  return process.env.BACKUP_UPLOAD === "catbox" && process.env.BACKUP_PASSPHRASE ? "catbox" : "discord";
};

export type BackupFile = { name: string; size: number; at: string };
export type BackupResult = { file: string; size: number; uploaded: boolean; via: "catbox" | "discord" | "none"; url?: string; removed: string[] };

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

/* ---------- encryption: "VDB1" + salt(16) + iv(12) + ciphertext + tag(16), aes-256-gcm, key from scrypt ---------- */

const MAGIC = Buffer.from("VDB1");

export function encryptBackup(plain: Buffer, passphrase: string): Buffer {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(passphrase, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, body, cipher.getAuthTag()]);
}

export function decryptBackup(data: Buffer, passphrase: string): Buffer {
  if (!data.subarray(0, 4).equals(MAGIC)) throw new Error("not a vensin backup");
  const salt = data.subarray(4, 20);
  const iv = data.subarray(20, 32);
  const tag = data.subarray(data.length - 16);
  const body = data.subarray(32, data.length - 16);
  const key = scryptSync(passphrase, salt, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

/* ---------- the job ---------- */

/** copies the live database (sqlite online backup, safe while the site runs), gzips it, rotates old files and sends it off-site */
export async function runBackup(): Promise<BackupResult> {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const base = path.join(BACKUP_DIR, `vensin-${stamp()}.sqlite`);
  await getDb().backup(base);
  const gz = `${base}.gz`;
  await pipeline(createReadStream(base), createGzip({ level: 9 }), createWriteStream(gz));
  await unlink(base);
  const size = statSync(gz).size;

  const removed: string[] = [];
  for (const old of listBackups().slice(KEEP)) {
    unlinkSync(path.join(BACKUP_DIR, old.name));
    removed.push(old.name);
  }

  const mode = backupUploadMode();
  if (mode === "local") return { file: path.basename(gz), size, uploaded: false, via: "none", removed };

  if (mode === "catbox") {
    const passphrase = process.env.BACKUP_PASSPHRASE!;
    const enc = encryptBackup(await readFile(gz), passphrase);
    const encName = `${path.basename(gz)}.enc`;
    const url = await uploadToCatbox(encName, enc);
    if (url) {
      const digest = createHash("sha256").update(enc).digest("hex").slice(0, 12);
      const ok = await postToDiscord(
        `🗄️ nightly backup · \`${encName}\` · ${(enc.length / 1024).toFixed(1)} kb · sha256 ${digest}\n${url}\n-# encrypted with BACKUP_PASSPHRASE · \`node scripts/decrypt-backup.mjs <file> <passphrase>\` gives you the .sqlite.gz`,
      );
      if (!ok) throw new Error("backup uploaded to catbox, but posting the link to discord failed");
      return { file: path.basename(gz), size, uploaded: true, via: "catbox", url, removed };
    }
    // catbox down: fall back to attaching the encrypted file so tonight is still covered
    const tmp = path.join(BACKUP_DIR, encName);
    await writeFile(tmp, enc);
    const ok = await postToDiscord(`🗄️ nightly backup · catbox was unreachable, so here is the encrypted file instead`, tmp);
    await unlink(tmp).catch(() => {});
    if (!ok) throw new Error("backup saved locally, but catbox and discord both failed");
    return { file: path.basename(gz), size, uploaded: true, via: "discord", removed };
  }

  const ok = await postToDiscord(`🗄️ nightly backup · \`${path.basename(gz)}\` · ${(size / 1024).toFixed(1)} kb\n-# gunzip it and drop it in as vensin.sqlite to restore`, gz);
  if (!ok) throw new Error("backup saved locally, but the discord upload failed");
  return { file: path.basename(gz), size, uploaded: true, via: "discord", removed };
}

/* ---------- transports ---------- */

async function uploadToCatbox(name: string, data: Buffer): Promise<string | null> {
  const body = new FormData();
  body.append("reqtype", "fileupload");
  if (process.env.CATBOX_USERHASH) body.append("userhash", process.env.CATBOX_USERHASH);
  body.append("fileToUpload", new Blob([new Uint8Array(data)], { type: "application/octet-stream" }), name);
  try {
    const res = await fetch(CATBOX, { method: "POST", body });
    const text = (await res.text()).trim();
    return res.ok && /^https:\/\/files\.catbox\.moe\//.test(text) ? text : null;
  } catch {
    return null;
  }
}

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
