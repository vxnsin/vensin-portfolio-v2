import { createHash } from "crypto";
import { getDb, uid } from "./db";

export type GuestbookStatus = "approved" | "pending" | "rejected";
export type GuestbookEntry = {
  id: string;
  name: string;
  message: string;
  website: string | null;
  createdAt: string;
  status: GuestbookStatus;
  reasons: string[];
};

type Row = { id: string; name: string; message: string; website: string | null; created_at: string; status: GuestbookStatus; reasons: string; ip_hash: string };
const toEntry = (r: Row): GuestbookEntry => ({ id: r.id, name: r.name, message: r.message, website: r.website, createdAt: r.created_at, status: r.status, reasons: JSON.parse(r.reasons || "[]") });

/* ---------- storage ---------- */

export function listGuestbook(opts: { status?: GuestbookStatus | "all"; limit?: number; offset?: number } = {}): GuestbookEntry[] {
  const { status = "approved", limit = 30, offset = 0 } = opts;
  const where = status === "all" ? "" : "where status = ?";
  const args = status === "all" ? [limit, offset] : [status, limit, offset];
  return (getDb().prepare(`select * from guestbook ${where} order by created_at desc limit ? offset ?`).all(...args) as Row[]).map(toEntry);
}

export function countGuestbook(status: GuestbookStatus | "all" = "approved"): number {
  const db = getDb();
  const r = (status === "all" ? db.prepare("select count(*) n from guestbook").get() : db.prepare("select count(*) n from guestbook where status = ?").get(status)) as { n: number };
  return r.n;
}

export function guestbookCounts(): Record<GuestbookStatus, number> {
  const rows = getDb().prepare("select status, count(*) n from guestbook group by status").all() as Array<{ status: GuestbookStatus; n: number }>;
  const out: Record<GuestbookStatus, number> = { approved: 0, pending: 0, rejected: 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export function getGuestbookEntry(id: string): GuestbookEntry | null {
  const r = getDb().prepare("select * from guestbook where id = ?").get(id) as Row | undefined;
  return r ? toEntry(r) : null;
}

export function addGuestbookEntry(e: { name: string; message: string; website: string | null; status: GuestbookStatus; reasons: string[]; ipHash: string }): GuestbookEntry {
  const row: Row = { id: uid(), name: e.name, message: e.message, website: e.website, created_at: new Date().toISOString(), status: e.status, reasons: JSON.stringify(e.reasons), ip_hash: e.ipHash };
  getDb()
    .prepare("insert into guestbook (id, name, message, website, created_at, status, reasons, ip_hash) values (@id, @name, @message, @website, @created_at, @status, @reasons, @ip_hash)")
    .run(row);
  return toEntry(row);
}

export function setGuestbookStatus(id: string, status: GuestbookStatus): GuestbookEntry | null {
  getDb().prepare("update guestbook set status = ? where id = ?").run(status, id);
  return getGuestbookEntry(id);
}

export function deleteGuestbookEntry(id: string) {
  getDb().prepare("delete from guestbook where id = ?").run(id);
}

/* ---------- spam screening ---------- */

export const ipHash = (ip: string) => createHash("sha256").update(`${process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? "vensin"}|${ip}`).digest("hex").slice(0, 32);

/** how many entries this visitor left in the last `ms` milliseconds */
export function recentFromVisitor(hash: string, ms: number): number {
  const since = new Date(Date.now() - ms).toISOString();
  const r = getDb().prepare("select count(*) n from guestbook where ip_hash = ? and created_at >= ?").get(hash, since) as { n: number };
  return r.n;
}

const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function isDuplicate(message: string): boolean {
  const target = normalise(message);
  const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  const rows = getDb().prepare("select message from guestbook where created_at >= ?").all(since) as Array<{ message: string }>;
  return rows.some((r) => normalise(r.message) === target);
}

const URL_RE = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|io|dev|xyz|ru|cn|top|shop|site|online|info|biz|club|live|store|app|me|co|gg|tv|to|link|cc|pw|de|eu)\b/i;
const SPAM_TERMS = [
  "casino", "viagra", "cialis", "forex", "crypto signal", "backlink", "seo service", "buy followers", "escort", "payday loan", "betting", "porn", "onlyfans",
  "telegram @", "whatsapp +", "click here", "earn money", "make money", "free money", "bitcoin invest", "nft drop", "guest post", "cheap price", "promo code",
];
// hard blocklist: slurs never get published, not even for review
const BLOCKED = ["nigger", "nigga", "faggot", "retard", "kike", "tranny", "spic", "chink", "hurensohn", "schwuchtel", "kanake", "neger"];
const SPAM_TLDS = /\.(xyz|top|ru|cn|shop|club|online|site|pw|cc|buzz|icu)(\/|$)/i;

export type Screening = { verdict: "approve" | "review" | "reject"; reasons: string[] };

/** decides whether an entry goes straight to the wall, waits for a look, or is dropped */
export function screenEntry(e: { name: string; message: string; website: string | null }): Screening {
  const text = `${e.name}\n${e.message}`;
  const lower = text.toLowerCase();
  const reasons: string[] = [];

  if (BLOCKED.some((w) => new RegExp(`\\b${w}`, "i").test(lower))) return { verdict: "reject", reasons: ["blocked word"] };
  if (/(.)\1{9,}/.test(e.message)) return { verdict: "reject", reasons: ["keyboard mashing"] };

  if (URL_RE.test(e.message)) reasons.push("link in message");
  if (URL_RE.test(e.name)) reasons.push("link in name");
  const spam = SPAM_TERMS.filter((t) => lower.includes(t));
  if (spam.length) reasons.push(`spam words: ${spam.join(", ")}`);
  if (e.website && SPAM_TLDS.test(e.website)) reasons.push("sketchy website tld");
  const letters = e.message.replace(/[^a-z]/gi, "");
  if (letters.length >= 20 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.7) reasons.push("all caps");
  if (/(.)\1{6,}/.test(e.message)) reasons.push("repeated characters");
  if (e.message.length > 700) reasons.push("very long");
  if ((e.message.match(/[^\p{L}\p{N}\p{P}\p{Z}\n]/gu)?.length ?? 0) > 12) reasons.push("lots of symbols");

  return { verdict: reasons.length ? "review" : "approve", reasons };
}
