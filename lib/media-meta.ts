import exifr from "exifr";

// When was a photo or video taken, and getting rid of where.
//
// Dates are kept as local wall-clock time with its offset ("2026-06-01T21:03:12+02:00"), so the gallery shows the
// time it was where the picture was taken, and server and browser render the same text.
// Photos lose all metadata (gps included) when sharp re-encodes them. Videos are stored as they are, so their
// location entries are blanked in place here: same file size, nothing re-encoded.

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** a Date as local wall time with this server's offset */
export function wallTime(d: Date): string {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const a = Math.abs(off);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

/** only dates that could be real: not before digital cameras, not in the future */
function plausible(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t) || t < Date.UTC(1995, 0, 1) || t > Date.now() + 86_400_000) return null;
  return iso;
}

const normOffset = (o: string | undefined) => {
  const m = o?.trim().match(/^([+-])(\d{2}):?(\d{2})$/);
  return m ? `${m[1]}${m[2]}:${m[3]}` : null;
};

/* ---------- photos ---------- */

/** the capture time from exif (jpeg, heic, png, tiff, webp). null when there is none. */
export async function photoTakenAt(buf: Buffer): Promise<string | null> {
  try {
    const tags = await exifr.parse(buf, { pick: ["DateTimeOriginal", "CreateDate", "OffsetTimeOriginal", "OffsetTime"], reviveValues: false });
    const raw: unknown = tags?.DateTimeOriginal ?? tags?.CreateDate;
    if (typeof raw !== "string") return null;
    const m = raw.match(/^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):?(\d{2})?/);
    if (!m) return null;
    const [, y, mo, d, h, mi, s = "00"] = m;
    const off = normOffset(tags?.OffsetTimeOriginal ?? tags?.OffsetTime);
    // without an offset the camera clock is taken as this server's local time
    return plausible(off ? `${y}-${mo}-${d}T${h}:${mi}:${s}${off}` : wallTime(new Date(+y, +mo - 1, +d, +h, +mi, +s)));
  } catch {
    return null;
  }
}

/* ---------- videos (mp4 / mov) ---------- */

type Box = { type: string; start: number; header: number; end: number };

function* boxes(buf: Buffer, from: number, to: number): Generator<Box> {
  let p = from;
  while (p + 8 <= to) {
    let size = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    let header = 8;
    if (size === 1) {
      if (p + 16 > to) return;
      size = Number(buf.readBigUInt64BE(p + 8));
      header = 16;
    } else if (size === 0) size = to - p;
    if (size < header || p + size > to) return;
    yield { type, start: p, header, end: p + size };
    p += size;
  }
}

// containers that can hold the movie header or metadata
const CONTAINERS = new Set(["moov", "trak", "udta", "meta", "mdia", "minf", "edts"]);

/** walks moov and calls `visit` for every box, with the parent chain */
function walk(buf: Buffer, visit: (b: Box, parents: string[]) => void) {
  const rec = (from: number, to: number, parents: string[]) => {
    for (const b of boxes(buf, from, to)) {
      visit(b, parents);
      if (!CONTAINERS.has(b.type)) continue;
      let inner = b.start + b.header;
      // the iso "meta" box has 4 bytes of version and flags before its children, quicktime's does not
      if (b.type === "meta" && buf.readUInt32BE(inner) === 0) inner += 4;
      rec(inner, b.end, [...parents, b.type]);
    }
  };
  for (const top of boxes(buf, 0, buf.length)) if (top.type === "moov") rec(top.start + top.header, top.end, ["moov"]);
}

/** the "keys" of a quicktime meta box: index (1-based) to name */
function metaKeys(buf: Buffer, keys: Box): Map<number, string> {
  const out = new Map<number, string>();
  let p = keys.start + keys.header + 4; // version + flags
  const count = buf.readUInt32BE(p);
  p += 4;
  for (let i = 1; i <= count && p + 8 <= keys.end; i++) {
    const size = buf.readUInt32BE(p);
    if (size < 8) break;
    out.set(i, buf.toString("utf8", p + 8, p + size));
    p += size;
  }
  return out;
}

/** each "data" box value inside an ilst item, as [start, end) of the value bytes */
function* ilstValues(buf: Buffer, item: Box): Generator<[number, number]> {
  for (const d of boxes(buf, item.start + item.header, item.end)) if (d.type === "data") yield [d.start + d.header + 8, d.end]; // skip type + locale
}

/** reads the recording time: apple's creationdate key (with the local offset) first, the movie header (utc) second */
export function videoTakenAt(buf: Buffer): string | null {
  let apple: string | null = null;
  let mvhd: string | null = null;
  try {
    let keys = new Map<number, string>();
    walk(buf, (b) => {
      if (b.type === "keys") keys = metaKeys(buf, b);
      if (b.type === "ilst") {
        for (const item of boxes(buf, b.start + b.header, b.end)) {
          const name = keys.get(buf.readUInt32BE(item.start + 4));
          if (name !== "com.apple.quicktime.creationdate") continue;
          for (const [s, e] of ilstValues(buf, item)) {
            const m = buf.toString("utf8", s, e).match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2}:?\d{2})?/);
            if (m) apple = m[2] ? `${m[1]}${normOffset(m[2])}` : wallTime(new Date(m[1]));
          }
        }
      }
      if (b.type === "mvhd") {
        const p = b.start + b.header;
        const version = buf[p];
        const secs = version === 1 ? Number(buf.readBigUInt64BE(p + 4)) : buf.readUInt32BE(p + 4);
        if (secs > 0) mvhd = wallTime(new Date((secs - 2_082_844_800) * 1000)); // seconds since 1904
      }
    });
  } catch {}
  return plausible(apple) ?? plausible(mvhd);
}

/** blanks every location entry in an mp4/mov in place; returns how many were found */
export function stripVideoLocation(buf: Buffer): number {
  let n = 0;
  const blank = (s: number, e: number) => {
    if (e > s) {
      buf.fill(0x20, s, e);
      n++;
    }
  };
  try {
    let keys = new Map<number, string>();
    walk(buf, (b) => {
      // quicktime / android: ©xyz holds "+52.5200+013.4050/"; 3gpp: loci
      if (b.type === "©xyz" || b.type === "loci") blank(b.start + b.header, b.end);
      if (b.type === "keys") keys = metaKeys(buf, b);
      if (b.type === "ilst") {
        for (const item of boxes(buf, b.start + b.header, b.end)) {
          const name = keys.get(buf.readUInt32BE(item.start + 4)) ?? "";
          if (/location/i.test(name)) for (const [s, e] of ilstValues(buf, item)) blank(s, e);
        }
      }
    });
  } catch {}
  return n;
}
